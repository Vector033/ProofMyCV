import Link from "next/link";
import type { Metadata } from "next";
import { demoEmail } from "@/lib/supabase/admin";
import { googleEnabled } from "@/lib/site";
import { IconAlert, IconCheck, IconLink, IconShield, IconX } from "@/components/icons";
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
    <main className="grid min-h-screen flex-1 lg:grid-cols-[1.15fr_1fr]">
      {/* Left: Dark Slate-800 architectural band, centered cleanly for wide screens */}
      <section className="hero-band hidden flex-col p-10 text-white lg:flex xl:p-14">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-between gap-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight">
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-white text-[13px] font-bold text-slate-900">
                F
              </span>
              <span className="text-base">
                Fact<span className="text-emerald-300">Fit</span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-200">
              <IconShield size={13} className="text-emerald-300" />
              <span className="tabular-nums">Fabrication Guard</span>
            </span>
          </div>

          {/* Middle Focal Area: Transformation Copy + Live Proof Specimen Card */}
          <div className="space-y-8">
            <div>
              <p className="display-heading text-3xl font-semibold text-white xl:text-4xl">
                Every bullet traces back to something you&nbsp;wrote.
              </p>
              <p className="body-prose mt-4 text-sm text-slate-300 xl:text-base">
                Numbers and tools that are not in your Fact Bank are blocked by code before they ever reach your&nbsp;resume.
              </p>
            </div>

            {/* Structured Product Verification Specimen Card */}
            <div
              aria-hidden="true"
              className="space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/65 p-5 shadow-2xl backdrop-blur-xs"
            >
              {/* Source Fact Anchor */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/70 pb-3 text-xs">
                <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-emerald-300 uppercase">
                  Source Fact · #f1
                </span>
                <span className="text-slate-400">PostgreSQL index · 25m → 3m</span>
              </div>

              {/* Rejected AI Row */}
              <div className="rounded-xl border border-red-400/30 bg-red-950/35 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.04em] text-red-200 uppercase">
                    Generic AI Draft
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-900/70 px-2 py-0.5 text-[11px] font-medium text-red-200">
                    <IconX size={11} /> Blocked
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200">
                  Cut reporting time by <span className="text-red-200 underline decoration-red-400 decoration-wavy underline-offset-4">90%</span> with a{" "}
                  <span className="text-red-200 underline decoration-red-400 decoration-wavy underline-offset-4">Redis</span>&nbsp;cache.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded bg-red-900/50 px-1.5 py-0.5 text-red-200">
                    <IconAlert size={11} /> 90% UNVERIFIED
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-red-900/50 px-1.5 py-0.5 text-red-200">
                    <IconX size={11} /> Redis NOT IN FACTS
                  </span>
                </div>
              </div>

              {/* Verified FactFit Row */}
              <div className="rounded-xl border border-emerald-400/35 bg-emerald-950/35 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-[0.04em] text-emerald-200 uppercase">
                    FactFit Output
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/70 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                    <IconCheck size={11} /> Traceable
                  </span>
                </div>
                <p className="mt-2 text-sm text-white">
                  Cut the daily report job from 25 to 3&nbsp;minutes with a PostgreSQL&nbsp;index.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-300">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <IconLink size={11} /> cite:f1
                  </span>
                  <span className="tabular-nums">3 / 3 tokens matched</span>
                </div>
              </div>
            </div>

            {/* Empirical Proof Strip */}
            <dl className="grid grid-cols-3 gap-4 border-t border-slate-700/70 pt-5">
              <div>
                <dt className="text-[11px] text-slate-400">Blocked, tuning set</dt>
                <dd className="mt-0.5 text-lg font-semibold text-white tabular-nums">547 / 547</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">Blocked, held-out</dt>
                <dd className="mt-0.5 text-lg font-semibold text-emerald-300 tabular-nums">180 / 186</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-400">ATS PDF size</dt>
                <dd className="mt-0.5 text-lg font-semibold text-white tabular-nums">&lt; 2.5 MB</dd>
              </div>
            </dl>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
            <p>Stores only what you type. Export or delete any&nbsp;time.</p>
            <Link href="/" className="shrink-0 text-slate-300 underline-offset-4 hover:text-white hover:underline">
              ← Overview
            </Link>
          </div>
        </div>
      </section>

      {/* Right: Calm Slate-50 canvas framing crisp white Sign-in card */}
      <section className="flex flex-col justify-center bg-slate-50 px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight text-slate-900 lg:hidden">
            <span aria-hidden className="grid size-6 place-items-center rounded bg-slate-900 text-xs font-bold text-white">
              F
            </span>
            <span>
              Fact<span className="text-emerald-700">Fit</span>
            </span>
          </Link>

          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.025em] text-slate-900 lg:mt-0">
            Your fact bank, your resume
          </h1>
          <p className="mt-1.5 text-sm leading-[1.6] text-slate-600">
            Sign in to keep your facts and one tailored version per&nbsp;job.
          </p>

          <div className="mt-6">
            <LoginForm google={googleEnabled()} oauthError={oauthError} />
          </div>

          {demoEmail() && (
            <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">Just looking?</p>
                <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-slate-700 uppercase">
                  Instant Sandbox
                </span>
              </div>
              <p className="mt-1 mb-3 text-xs leading-relaxed text-slate-600">
                A shared account with a fictional fact bank. No&nbsp;sign&#8209;up&nbsp;needed.
              </p>
              <DemoButton />
            </div>
          )}

          <p className="mt-5 text-center text-xs text-slate-500">
            Traceable to your Fact Bank · Delete data anytime
          </p>
        </div>
      </section>
    </main>
  );
}
