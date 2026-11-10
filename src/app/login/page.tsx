import Link from "next/link";
import type { Metadata } from "next";
import { demoEmail } from "@/lib/supabase/admin";
import { googleEnabled } from "@/lib/site";
import { DemoButton } from "./demo-button";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const OAUTH_ERRORS: Record<string, string> = {
  cancelled: "Google sign-in was cancelled. Try again, or use your email.",
  failed: "Google sign-in didn't finish. Try again, or use your email.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { oauth } = await searchParams;
  const oauthError = typeof oauth === "string" ? OAUTH_ERRORS[oauth] : undefined;
  return (
    <main className="grid flex-1 lg:grid-cols-[1fr_minmax(0,520px)]">
      {/* Left: the dark band from the landing page, with the promise in one line. */}
      <section className="hero-band hidden flex-col justify-between p-10 text-white lg:flex">
        <Link href="/" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-white text-[13px] font-bold text-slate-800">
            F
          </span>
          <span>
            Fact<span className="text-emerald-300">Fit</span>
          </span>
        </Link>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-medium tracking-tight text-balance">
            Every bullet traces back to something you&nbsp;wrote.
          </p>
          <p className="mt-4 text-slate-300">
            Numbers and tools that are not in your facts are blocked by code before they reach your&nbsp;resume.
          </p>
          {/* The landing demo's fictional fact: 25 → 3 minutes, PostgreSQL. Same verdicts the real guard gives. */}
          <div aria-hidden className="mt-10 space-y-5 text-sm">
            <div className="border-l-2 border-red-400/70 pl-4">
              <p className="text-slate-300">
                Cut reporting time by <span className="text-red-200 underline decoration-red-400 decoration-wavy underline-offset-4">90%</span> with a{" "}
                <span className="text-red-200 underline decoration-red-400 decoration-wavy underline-offset-4">Redis</span>&nbsp;cache.
              </p>
              <p className="mt-1.5 text-xs text-red-300">Blocked: 90% and Redis are not in your&nbsp;facts</p>
            </div>
            <div className="border-l-2 border-emerald-400/80 pl-4">
              <p className="text-white">Cut the daily report job from 25 to 3&nbsp;minutes with a PostgreSQL&nbsp;index.</p>
              <p className="mt-1.5 text-xs text-emerald-300">✓ Traceable, cites 1&nbsp;fact</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">FactFit stores only what you type. Export or delete it any&nbsp;time.</p>
      </section>

      <section className="flex flex-col justify-center bg-white px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="rounded-md font-semibold tracking-tight text-slate-900 lg:hidden">
            Fact<span className="text-emerald-700">Fit</span>
          </Link>
          <h1 className="mt-8 text-2xl font-medium tracking-tight text-slate-900 lg:mt-0">Your fact bank, your resume</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in to keep your facts and one tailored version per&nbsp;job.</p>

          <div className="mt-8">
            <LoginForm google={googleEnabled()} oauthError={oauthError} />
          </div>

          {demoEmail() && (
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Just looking?</p>
              <p className="mt-0.5 mb-3 text-xs text-slate-600">A shared account with a fictional fact bank. No&nbsp;sign&#8209;up&nbsp;needed.</p>
              <DemoButton />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
