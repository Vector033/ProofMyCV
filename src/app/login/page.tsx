import Link from "next/link";
import type { Metadata } from "next";
import { demoEmail } from "@/lib/supabase/admin";
import { DemoButton } from "./demo-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="hero-glow flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="rounded-sm font-semibold tracking-tight text-stone-900">
          Fact<span className="text-emerald-700">Fit</span>
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-stone-900">Your fact bank, your resume</h1>
        <p className="mt-2 text-sm text-stone-600">Sign in to keep your facts and one tailored version per job.</p>

        <div className="card mt-6 p-5 shadow-[0_1px_2px_rgb(28_25_23/0.04),0_12px_32px_-16px_rgb(28_25_23/0.12)]">
          <LoginForm />
        </div>

        {demoEmail() && (
          <div className="mt-6">
            <DemoButton />
            <p className="mt-2 text-xs text-stone-500">A shared account with a fictional fact bank. No sign-up needed.</p>
          </div>
        )}
        <p className="mt-8 text-xs leading-relaxed text-stone-500">
          FactFit stores only what you type into it. You can export or delete everything from Settings.
        </p>
      </div>
    </main>
  );
}
