"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, demoEmail } from "@/lib/supabase/admin";
import { LIMITS, RateLimitError, clientIp, enforce, hit, retryText } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { passwordProblem } from "@/lib/password";
import { googleEnabled, requestOrigin } from "@/lib/site";

export type AuthState = { error?: string; message?: string };

const credentials = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  mode: z.enum(["signin", "signup"]),
});

const ALREADY_REGISTERED = /already (been )?registered/i;

export async function authAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, mode } = parsed.data;
  const ip = await clientIp();

  try {
    if (mode === "signup") await enforce([LIMITS.signupIp, ip]);
    await enforce([LIMITS.signinIp, ip], [LIMITS.signinEmail, email]);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: `Too many attempts. Try again in ${retryText(e.retryAfterSec)}.` };
    throw e;
  }

  if (mode === "signup") {
    const problem = passwordProblem(password, email);
    if (problem) return { error: problem };
    // Accounts are created server-side and marked confirmed. ProofMyCV sends no
    // email, so the Supabase project (shared with other apps) needs no
    // confirmation link or redirect URL configured for it.
    const { error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      return { error: ALREADY_REGISTERED.test(error.message) ? "That email already has an account. Sign in instead." : error.message };
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message === "Invalid login credentials" ? "Wrong email or password." : error.message };
  redirect("/app");
}

/** Opens the shared demo account. The credentials stay on the server. */
export async function demoLoginAction(): Promise<AuthState> {
  const email = demoEmail();
  if (!email) return { error: "This server has no demo account." };
  const limit = await hit(LIMITS.demoIp, await clientIp());
  if (!limit.ok) return { error: `The demo was opened too often from here. Try again in ${retryText(limit.retryAfterSec)}.` };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: process.env.DEMO_PASSWORD! });
  if (error) return { error: "Could not open the demo account." };
  redirect("/app");
}

/** Starts "Continue with Google": Supabase sends the browser to Google and back to /auth/callback. */
export async function googleSignInAction(): Promise<AuthState> {
  if (!googleEnabled()) return { error: "Google sign-in is not set up on this server." };
  const limit = await hit(LIMITS.signinIp, await clientIp());
  if (!limit.ok) return { error: `Too many attempts. Try again in ${retryText(limit.retryAfterSec)}.` };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback?next=/app` },
  });
  if (error || !data.url) return { error: "Could not reach Google. Try again, or sign in with your email." };
  redirect(data.url);
}
