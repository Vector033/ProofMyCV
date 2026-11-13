import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { HeroShader } from "@/components/hero-shader";
import { ProofDemo } from "@/components/proof-demo";
import { Steps } from "@/components/steps";
import { VerificationPipeline } from "@/components/verification-pipeline";
import { BenchmarkMetrics } from "@/components/benchmark-metrics";
import { AtsAnatomy } from "@/components/ats-anatomy";
import { InView } from "@/components/in-view";
import { IconArrowRight, IconCheck, IconShield, IconX } from "@/components/icons";
import { DemoButton } from "./login/demo-button";

// Numbers from eval/README.md (fictional cases). Update both together.
const comparisonRows = [
  {
    feature: "Numbers",
    ai: "Told to “add impressive metrics”, Typhoon 2.5 invented or inflated 26 claims",
    factfit: "Blocked 26 / 26 of them, and 547 / 547 on the tuning cases",
  },
  {
    feature: "Tools",
    ai: "A draft can name tools that are not in your facts",
    factfit: "Every tool name is checked against the cited facts (37 / 37 held-out)",
  },
  {
    feature: "In an interview",
    ai: "No link from a sentence back to what you did",
    factfit: "Every bullet cites 1 or more of your facts",
  },
  {
    feature: "Record",
    ai: "No record of where a claim came from",
    factfit: "Each bullet stores the IDs of the facts it cites",
  },
  {
    feature: "PDF layout",
    ai: "Multi-column templates can be read out of order",
    factfit: "Single column, selectable text, under 2.5 MB",
  },
];

const safetyNetTimeline = [
  { step: "1", label: "Paste JD" },
  { step: "2", label: "Fact Guard" },
  { step: "3", label: "Clean ATS PDF" },
] as const;

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;
  const demo = Boolean(demoEmail());

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Sticky top nav: fluted glass over --canvas */}
      <header className="fluted-glass sticky top-0 z-50 border-b border-slate-200/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md font-semibold tracking-tight">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-md bg-slate-900 text-[13px] font-bold text-white shadow-2xs"
            >
              F
            </span>
            <span className="text-base text-slate-900">
              Fact<span className="text-emerald-700">Fit</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#demo" className="transition-colors hover:text-slate-900">
              Demo
            </a>
            <a href="#how" className="transition-colors hover:text-slate-900">
              How it works
            </a>
            <a href="#architecture" className="transition-colors hover:text-slate-900">
              The guard
            </a>
            <a href="#measured" className="transition-colors hover:text-slate-900">
              Results
            </a>
            <a href="#comparison" className="transition-colors hover:text-slate-900">
              Comparison
            </a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/login"
              className="press inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="press inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium tracking-[0.04em] text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98]"
            >
              Tailor My Resume
            </Link>
          </div>
        </div>
      </header>

      {deleted && (
        <div
          role="status"
          className="border-b border-slate-200 bg-emerald-50 px-4 py-2.5 text-center text-xs font-medium text-emerald-900 sm:px-6"
        >
          Your FactFit account and data have been permanently deleted.
        </div>
      )}

      <main className="flex-1">
        {/* ================= HERO SECTION (64–96px rhythm, 8pt double-rule) ================= */}
        <section className="relative overflow-hidden pt-16 pb-16 sm:pt-20 sm:pb-24">
          {/* GPU Fragment Shader over --canvas (#f8fafc) with radial fade + reduced-motion/offscreen guard */}
          <HeroShader />

          {/* #18 Square-dot grid, faded at the edges */}
          <div aria-hidden="true" className="bg-blueprint-dots absolute inset-0 z-0" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
            {/* The measured result, stated with its scope (eval/README.md) */}
            <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1 text-left text-xs font-medium text-slate-700 shadow-2xs">
              <IconShield size={14} className="shrink-0 text-emerald-700" />
              <span>
                <span className="font-semibold text-emerald-800 tabular-nums">547 / 547</span> fabrications blocked on the
                tuning&nbsp;set
              </span>
            </p>

            {/* Display Headline (-0.025em tracking, 1.1 line-height, text-balance) */}
            <h1 className="display-heading mx-auto mt-4 max-w-4xl text-4xl font-semibold text-slate-900 sm:text-6xl">
              Tailor your resume to each job without inventing a single&nbsp;fact.
            </h1>

            {/* Subtitle (50–75ch width, 1.6 line-height, natural wrapping) */}
            <p className="body-prose mx-auto mt-4 max-w-[60ch] text-lg text-slate-600 sm:text-xl">
              AI resume tools can invent numbers and add skills you never used. FactFit matches your
              real achievements to each job and blocks any claim it cannot trace to your
              Fact&nbsp;Bank.
            </p>

            {/* Primary CTA + Risk Reversal Microcopy (32px inter-group gap) */}
            <div className="mt-8 flex flex-col items-center">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[15px] font-semibold tracking-[0.04em] text-white shadow-sm shadow-slate-950/20 hover:bg-slate-800 active:scale-[0.98]"
                >
                  Tailor My Resume
                  <IconArrowRight size={16} className="text-slate-300" />
                </Link>

                {demo && (
                  <DemoButton
                    className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-medium tracking-[0.04em] text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                    label="Try Live Demo"
                  />
                )}
              </div>

              {/* Risk Reversal Microcopy directly beneath primary CTAs */}
              <p className="mt-3 text-xs font-medium text-slate-600">
                Traceable to your Fact Bank · 1&#8209;click&nbsp;PDF
              </p>
            </div>

            {/* 3-Step Safety Net Timeline */}
            <ol
              aria-label="3-step verification flow"
              className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white/85 px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs backdrop-blur-xs"
            >
              {safetyNetTimeline.map((item, idx) => (
                <li key={item.step} className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-grid size-5 place-items-center rounded bg-slate-100 font-mono text-[11px] font-semibold text-slate-800 tabular-nums">
                    {item.step}
                  </span>
                  <span className="text-slate-800">{item.label}</span>
                  {idx < safetyNetTimeline.length - 1 && (
                    <IconArrowRight size={13} className="text-slate-400" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* ================= INTERACTIVE PROOF SHOWCASE (32px+ inter-group spacing) ================= */}
          <section id="demo" aria-label="Interactive proof showcase" className="relative z-10 mx-auto mt-10 max-w-5xl px-4 sm:mt-12 sm:px-6">
            <ProofDemo />
            <p className="mt-4 text-center text-xs text-slate-600">
              The real fabrication guard, running in your browser on a fictional&nbsp;fact.
            </p>
          </section>
        </section>

        {/* ================= HOW IT WORKS (Animated Specimens) ================= */}
        <section id="how" aria-labelledby="how-heading" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="how-heading"
              title="How FactFit works"
              subtitle={"Three steps from what you actually did to a single-column PDF you can explain line by\u00A0line."}
            />

            <Steps />
          </div>
        </section>

        {/* ================= DETERMINISTIC PIPELINE & 3-LAYER GUARD ================= */}
        <section id="architecture" aria-labelledby="arch-heading" className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="arch-heading"
              title="Blocked by code, not by a prompt"
              subtitle={"The model is asked to cite its facts, but FactFit never takes its word for it. Plain code checks every number, unit and tool name in a bullet before it can be\u00A0saved."}
            />

            <InView className="mt-8">
              <VerificationPipeline />
            </InView>
          </div>
        </section>

        {/* ================= EMPIRICAL EVALUATION DATA ================= */}
        <section id="measured" aria-labelledby="measured-heading" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="measured-heading"
              title="Measured, not promised"
              subtitle={"The guard was tested on 40 fictional job postings with hand-written fabrications. 10 of them were held out until it was\u00A0tuned."}
            />

            <BenchmarkMetrics />

            {/* Where the guard stops, in the words of eval/README.md */}
            <p className="body-prose mt-10 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Where it stops.</span> All 6 held-out misses kept the
              number and unit but changed what it counts, such as &ldquo;120 members&rdquo; written as
              &ldquo;120 bookings&rdquo;. The guard checks numbers, units and names; it does not understand meaning.
              It also blocks some honest rewording, such as a percentage you worked out yourself. You review every
              bullet before&nbsp;export.
            </p>
          </div>
        </section>

        {/* ================= ATS ANATOMY & COMPARISON MATRIX ================= */}
        <section id="comparison" aria-labelledby="comparison-heading" className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="comparison-heading"
              title="With and without a code check"
              subtitle={"What an unchecked AI draft leaves you with, next to what FactFit checks before a bullet is\u00A0saved."}
            />

            <InView className="mt-10">
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
              <table className="block w-full text-left text-sm md:table">
                <thead className="sr-only md:not-sr-only md:table-header-group">
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-900">
                    <th scope="col" className="py-3.5 pr-4 pl-6">
                      <span className="sr-only">What is compared</span>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      Unchecked AI draft
                    </th>
                    <th scope="col" className="py-3.5 pr-6 pl-4">
                      With FactFit
                    </th>
                  </tr>
                </thead>
                <tbody className="block divide-y divide-slate-100 md:table-row-group">
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="block space-y-1.5 px-4 py-4 md:table-row md:space-y-0 md:p-0">
                      <th scope="row" className="block font-semibold text-slate-900 md:table-cell md:py-3.5 md:pr-4 md:pl-6 md:font-medium md:whitespace-nowrap">
                        {row.feature}
                      </th>
                      <td className="block text-slate-700 md:table-cell md:px-4 md:py-3.5">
                        <span className="flex items-start gap-2">
                          <IconX size={14} className="mt-1 shrink-0 text-red-700" />
                          <span>
                            <span className="sr-only">Unchecked AI draft: </span>
                            {row.ai}
                          </span>
                        </span>
                      </td>
                      <td className="block font-medium text-emerald-900 tabular-nums md:table-cell md:py-3.5 md:pr-6 md:pl-4">
                        <span className="flex items-start gap-2">
                          <IconCheck size={14} className="mt-1 shrink-0 text-emerald-700" />
                          <span>
                            <span className="sr-only">With FactFit: </span>
                            {row.factfit}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </InView>

            <div className="mt-12">
              <AtsAnatomy />
            </div>
          </div>
        </section>

        {/* ================= CLOSING CTA ================= */}
        <section className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl sm:p-12">
              <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="display-heading text-2xl font-semibold sm:text-3xl">
                    Start with one true&nbsp;sentence.
                  </h2>
                  <p className="body-prose mt-4 text-sm text-slate-300 sm:text-base">
                    Log your achievements once, match them to any job description, and export a
                    single-column PDF you can explain line by&nbsp;line.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start md:items-end">
                  <Link
                    href="/login"
                    className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold tracking-[0.04em] text-slate-900 shadow-sm hover:bg-slate-100 active:scale-[0.98]"
                  >
                    Tailor My Resume
                    <IconArrowRight size={16} className="text-slate-700" />
                  </Link>
                  <p className="mt-2.5 text-xs text-slate-400">
                    Traceable to your Fact Bank · 1&#8209;click&nbsp;PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-slate-900">
              Fact<span className="text-emerald-700">Fit</span>
            </span>
            <span aria-hidden className="text-slate-500">·</span>
            <span>Fact-checked resume tailoring</span>
          </div>
          <p>
            FactFit stores only what you enter. Export or delete your data at any&nbsp;time.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-[65ch]">
      <h2 id={id} className="display-heading text-2xl font-semibold text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <p className="body-prose mt-4 text-sm text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}
