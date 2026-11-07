"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient, demoEmail } from "@/lib/supabase/admin";
import { LIMITS, RateLimitError, clientIp, enforce, hit, retryText } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

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
    if (password.length < 10) return { error: "New passwords need at least 10 characters." };
    // Accounts are created server-side and marked confirmed. FactFit sends no
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
