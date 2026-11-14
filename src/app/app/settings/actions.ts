"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { getAccount, revokeSession } from "@/lib/account";
import { passwordProblem } from "@/lib/password";
import { LIMITS, RateLimitError, enforce, retryText } from "@/lib/rate-limit";
import { googleEnabled, requestOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; message?: string };

const DEMO = "The demo account is shared, so its sign-in settings can't be changed.";

/**
 * Checks the current password without touching the browser's session: a throwaway
 * client signs in, and that extra session is ended straight away.
 */
async function verifyPassword(email: string, password: string) {
  const temp = createStatelessClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await temp.auth.signInWithPassword({ email, password });
  if (error) return false;
  await temp.auth.signOut({ scope: "local" });
  return true;
}

export async function changePasswordAction(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const account = await getAccount();
  if (account.demo) return { error: DEMO };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  try {
    await enforce([LIMITS.signinEmail, account.email]);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: `Too many attempts. Try again in ${retryText(e.retryAfterSec)}.` };
    throw e;
  }

  const problem = passwordProblem(next, account.email);
  if (problem) return { error: problem };
  if (next !== confirm) return { error: "The two new passwords don't match. Type them again." };
  if (account.hasPassword) {
    if (!current) return { error: "Enter your current password." };
    if (current === next) return { error: "The new password is the same as the current one." };
    if (!(await verifyPassword(account.email, current))) return { error: "Your current password is wrong." };
  }

  const supabase = await createClient();
  // Send the current password too: Supabase demands it (when the project setting "Require current
  // password" is on) for accounts that already have one, and ignores it otherwise.
  const { error } = await supabase.auth.updateUser({ password: next, ...(current && { current_password: current }) });
  if (error) {
    if (error.code?.startsWith("current_password")) return { error: "Your current password is wrong." };
    return { error: "Could not save the new password. Try again in a minute." };
  }
  if (fd.get("signOutOthers") === "on") await supabase.auth.signOut({ scope: "others" });
  revalidatePath("/app/settings", "layout");
  return {
    message: account.hasPassword
      ? "Password changed."
      : "Password set. You can now sign in with your email as well as Google.",
  };
}

export async function signOutOthersAction(): Promise<SettingsState> {
  const account = await getAccount();
  if (account.demo) return { error: DEMO };
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) return { error: "Could not sign out the other devices. Try again." };
  revalidatePath("/app/settings/security");
  return { message: "Signed out everywhere except this device." };
}

export async function revokeSessionAction(sessionId: string): Promise<void> {
  const account = await getAccount();
  if (account.demo || !/^[0-9a-f-]{36}$/i.test(sessionId)) return;
  await revokeSession(account, sessionId);
  revalidatePath("/app/settings/security");
}

/** "Connect Google": Supabase links the Google identity, then returns to Settings. */
export async function linkGoogleAction(): Promise<SettingsState> {
  const account = await getAccount();
  if (account.demo) return { error: DEMO };
  if (!googleEnabled()) return { error: "Google sign-in is not set up on this server." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent("/app/settings?linked=google")}` },
  });
  if (error || !data.url) {
    return {
      error: /manual linking/i.test(error?.message ?? "")
        ? "Connecting accounts is turned off on this server."
        : "Could not reach Google. Try again.",
    };
  }
  redirect(data.url);
}

export async function unlinkGoogleAction(): Promise<SettingsState> {
  const account = await getAccount();
  if (account.demo) return { error: DEMO };
  if (!account.google) return {};
  // Never remove the last way in.
  if (!account.hasPassword) return { error: "Set a password first, so you can still sign in without Google." };
  // Supabase refuses to unlink a user's last identity; a password alone adds none.
  if (account.identityCount < 2) return { error: "Google is this account's only linked identity, so it stays connected." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUserIdentities();
  const identity = data?.identities.find((i) => i.provider === "google");
  if (!identity) return {};
  const { error } = await supabase.auth.unlinkIdentity(identity);
  if (error) return { error: "Could not disconnect Google. Try again." };
  revalidatePath("/app/settings", "layout");
  return { message: "Google disconnected. Sign in with your email and password from now on." };
}
