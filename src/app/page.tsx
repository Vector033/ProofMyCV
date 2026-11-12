import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { HeroShader } from "@/components/hero-shader";
import { ProofDemo } from "@/components/proof-demo";
import { AnimatedSteps } from "@/components/animated-steps";
import { VerificationPipeline } from "@/components/verification-pipeline";
import { BenchmarkMetrics } from "@/components/benchmark-metrics";
import { AtsAnatomy } from "@/components/ats-anatomy";
import { IconArrowRight, IconCheck, IconShield, IconX } from "@/components/icons";
import { DemoButton } from "./login/demo-button";

const comparisonRows = [
  // Numbers from eval/README.md (fictional cases). Update both together.
  {
    feature: "Metric Integrity",
    ai: "Invented 26 claims when told to “add impressive metrics” (Typhoon 2.5)",
    factfit: "Blocked 26 / 26 of them; 547 / 547 on tuning cases",
  },
  {
    feature: "Tech Stack Accuracy",
    ai: "Adds tools that are not in your facts",
    factfit: "Every tool name checked against the cited facts (37 / 37 held-out)",
  },
  {
    feature: "Interview Defense",
    ai: "No link from a sentence back to what you did",
    factfit: "Every claim links to 1 or more source facts",
  },
  {
    feature: "Audit Trail",
    ai: "No record of where a claim came from",
    factfit: "Each bullet stores the IDs of the facts it cites",
  },
  {
    feature: "PDF Format",
    ai: "Multi-column layout prone to ATS parser skips",
    factfit: "Single-column selectable text PDF (< 2.5 MB)",
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
      {/* ================= STICKY TOP NAV (#2 Fluted Glass over --canvas) ================= */}
      <header className="fluted-glass sticky top-0 z-50 border-b border-slate-200/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
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
              Proof Demo
            </a>
            <a href="#how" className="transition-colors hover:text-slate-900">
              Workflow
            </a>
            <a href="#architecture" className="transition-colors hover:text-slate-900">
              Guard Spec
            </a>
            <a href="#measured" className="transition-colors hover:text-slate-900">
              Benchmarks
            </a>
            <a href="#comparison" className="transition-colors hover:text-slate-900">
              Comparison
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="press inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="press inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium tracking-[0.04em] text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98]"
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

          {/* #7 Blueprint Grid + #18 Square-Dot Grid (--hairline, 24px spacing, radial fade) */}
          <div aria-hidden="true" className="bg-blueprint-dots absolute inset-0 z-0" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
            {/* Transformation & Safety Net Pill (paired with uniform IconShield) */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1 text-xs font-medium text-slate-800 shadow-2xs">
              <IconShield size={14} className="shrink-0 text-emerald-700" />
              <span className="font-semibold text-emerald-800 tabular-nums">547 / 547 blocked</span>
              <span className="text-slate-300">—</span>
              <span>invented numbers and tools in&nbsp;testing</span>
            </div>

            {/* Display Headline (-0.025em tracking, 1.1 line-height, text-balance) */}
            <h1 className="display-heading mx-auto mt-4 max-w-4xl text-4xl font-semibold text-slate-900 sm:text-6xl">
              Tailor your resume to each job without inventing a single&nbsp;fact.
            </h1>

            {/* Subtitle (50–75ch width, 1.6 line-height, natural wrapping) */}
            <p className="body-prose mx-auto mt-4 max-w-[60ch] text-lg text-slate-600 sm:text-xl">
              Generic AI resume tools fabricate numbers and exaggerate skills. FactFit maps your real
              achievements to job descriptions and blocks any claim you cannot trace back to your
              verified Fact&nbsp;Bank.
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
              eyebrow="Workflow"
              title="How FactFit works"
              subtitle={"Three deterministic steps from raw career facts to a single-column, ATS-compliant PDF you can defend in any\u00A0interview."}
            />

            <AnimatedSteps />
          </div>
        </section>

        {/* ================= DETERMINISTIC PIPELINE & 3-LAYER GUARD ================= */}
        <section id="architecture" aria-labelledby="arch-heading" className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="arch-heading"
              eyebrow="Under the Hood"
              title="Blocked by deterministic code, not prompt wishes"
              subtitle={"Even when an LLM tries to impress recruiters by inventing numbers, the 3-layer verification guard intercepts every token before it can be\u00A0saved."}
            />

            <div className="mt-8">
              <VerificationPipeline />
            </div>
          </div>
        </section>

        {/* ================= EMPIRICAL EVALUATION DATA ================= */}
        <section id="measured" aria-labelledby="measured-heading" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="measured-heading"
              eyebrow="Empirical Benchmarks"
              title="Measured, not promised"
              subtitle={"Tested on 40 fictional job postings. The code guard checks numbers, units, and technical\u00A0names."}
            />

            <BenchmarkMetrics />

            {/* Technical Boundary Callout (Strict Engineering Honesty) */}
            <div className="mt-8 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 text-xs leading-[1.6] text-slate-600 shadow-2xs">
              <span className="font-semibold text-slate-800">Known Technical Boundary:</span> The guard
              evaluates numerical quantities, measurement units, and technology terminology. It flags
              semantic drift (e.g. inventing Redis when not in facts), but does not parse semantic noun
              context (e.g. &ldquo;120 members&rdquo; rewritten as &ldquo;120 customers&rdquo;). The user
              remains the ultimate reviewer of every generated bullet before PDF&nbsp;export.
            </div>
          </div>
        </section>

        {/* ================= ATS ANATOMY & COMPARISON MATRIX ================= */}
        <section id="comparison" aria-labelledby="comparison-heading" className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="comparison-heading"
              eyebrow="Architectural Advantage"
              title="FactFit vs Unconstrained AI Resume Builders"
              subtitle={"Why deterministic code checks and single-column PDF structure outperform decorative templates and prompt\u2011only\u00A0AI."}
            />

            <div className="mt-8">
              <AtsAnatomy />
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold tracking-[0.04em] text-slate-600 uppercase">
                      <th className="py-3.5 pl-6 pr-4">Evaluation Dimension</th>
                      <th className="px-4 py-3.5 text-red-800">Unchecked LLM Output</th>
                      <th className="py-3.5 pr-6 pl-4 text-emerald-900">FactFit Verification Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-3.5 pl-6 pr-4 font-medium whitespace-nowrap text-slate-900">{row.feature}</td>
                        <td className="px-4 py-3.5 text-red-800">
                          <span className="inline-flex items-center gap-2">
                            <IconX size={14} className="shrink-0 text-red-700" />
                            <span>{row.ai}</span>
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 pl-4 font-medium text-emerald-900">
                          <span className="inline-flex items-center gap-2">
                            <IconCheck size={14} className="shrink-0 text-emerald-700" />
                            <span>{row.factfit}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                    Log your achievements once, match against any job description, and export a clean
                    single-column PDF you can defend with total&nbsp;confidence.
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
            <span className="text-slate-300">·</span>
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

function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-[65ch]">
      <p className="text-xs font-semibold tracking-[0.04em] text-emerald-800 uppercase">{eyebrow}</p>
      <h2 id={id} className="display-heading mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <p className="body-prose mt-4 text-sm text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}
