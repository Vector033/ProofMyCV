import Link from "next/link";
import type { Metadata } from "next";
import { demoEmail } from "@/lib/supabase/admin";
import { DemoButton } from "./demo-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-8 font-semibold tracking-tight">
        Fact<span className="text-emerald-700">Fit</span>
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Your fact bank, your resume</h1>
      <LoginForm />
      {demoEmail() && (
        <div className="mt-6 border-t border-stone-200 pt-6">
          <DemoButton />
          <p className="mt-2 text-xs text-stone-500">A shared account with a fictional fact bank. No sign-up needed.</p>
        </div>
      )}
      <p className="mt-6 text-xs text-stone-500">
        FactFit stores only what you type into it. You can export or delete everything from Settings.
      </p>
    </main>
  );
}
