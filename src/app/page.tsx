import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { HeroShader } from "@/components/hero-shader";
import { ProofDemo } from "@/components/proof-demo";
import { AnimatedSteps } from "@/components/animated-steps";
import { VerificationPipeline } from "@/components/verification-pipeline";
import { BenchmarkMetrics } from "@/components/benchmark-metrics";
import { AtsAnatomy } from "@/components/ats-anatomy";
import { IconArrowDown } from "@/components/icons";
import { DemoButton } from "./login/demo-button";

const comparisonRows = [
  {
    feature: "Metric Integrity",
    ai: "Hallucinates +30% to +80% fabricated boosts",
    factfit: "0% hallucination — blocked by AST code guard",
  },
  {
    feature: "Tech Stack Accuracy",
    ai: "Injects buzzwords absent from your background",
    factfit: "Strictly cross-referenced with your Fact Bank",
  },
  {
    feature: "Interview Defense",
    ai: "Candidate stumbles when asked for proof",
    factfit: "Every single claim links to a real, verifiable fact",
  },
  {
    feature: "Background Checks",
    ai: "High risk of offer rescission on discrepancy",
    factfit: "100% auditable career achievements",
  },
  {
    feature: "PDF Format",
    ai: "Multi-column layout prone to ATS parsing errors",
    factfit: "Single-column ATS-optimized clean text PDF",
  },
];

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
              Interactive Demo
            </a>
            <a href="#how" className="transition-colors hover:text-slate-900">
              How It Works
            </a>
            <a href="#architecture" className="transition-colors hover:text-slate-900">
              Architecture
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
              className="press inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white shadow-2xs hover:bg-slate-800 active:scale-[0.98]"
            >
              Get Started
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
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
          {/* GPU Fragment Shader over --canvas (#f8fafc) with radial fade + reduced-motion/offscreen guard */}
          <HeroShader />

          {/* #7 Blueprint Grid + #18 Square-Dot Grid (--hairline at ~45% opacity, 24px spacing, radial fade) */}
          <div aria-hidden="true" className="bg-blueprint-dots absolute inset-0 z-0" />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6">
            {/* Functional Status Badge (Strict Anti-AI-Slop: zero filler, pure engineering statement) */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>AST Code Verification Guard</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-emerald-800">0% Hallucination Guarantee</span>
            </div>

            {/* Main Headline: Stripe/Linear editorial typography with text-balance */}
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 text-balance sm:text-6xl sm:leading-[1.1]">
              Tailor your resume to each job without inventing a single&nbsp;fact.
            </h1>

            {/* Subtitle: natural line flow without weird orphan breaks */}
            <p className="mx-auto mt-6 max-w-[60ch] text-lg leading-relaxed text-slate-600 sm:text-xl">
              Generic AI resume tools fabricate numbers and exaggerate skills. FactFit maps your real
              achievements to job descriptions and blocks any claim you cannot trace back to your
              verified Fact&nbsp;Bank.
            </p>

            {/* Primary CTA Row: Requirement 4 "Tailor Resume with 0% Hallucination" */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 sm:mt-10">
              <Link
                href="/login"
                className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[15px] font-semibold text-white shadow-xs shadow-slate-950/20 hover:bg-slate-800 active:scale-[0.98]"
              >
                Tailor Resume with 0% Hallucination
                <IconArrowDown className="-rotate-90 text-slate-400" size={16} />
              </Link>

              {demo && (
                <DemoButton
                  className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-medium text-slate-700 shadow-2xs hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                  label="Try Interactive Demo"
                />
              )}
            </div>

            {/* Trust Assurance Strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-1 rounded-full bg-emerald-600" />
                Deterministic AST Guard
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-1 rounded-full bg-emerald-600" />
                Zero Fabricated Metrics
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="size-1 rounded-full bg-emerald-600" />
                Single-Column ATS PDF
              </span>
            </div>
          </div>

          {/* ================= INTERACTIVE PROOF SHOWCASE ================= */}
          <section id="demo" aria-label="Interactive proof showcase" className="relative z-10 mx-auto mt-12 max-w-5xl px-4 sm:px-6">
            <ProofDemo />
            <p className="mt-3 text-center text-xs text-slate-600">
              Real client-side AST fabrication guard running on demo&nbsp;fact&nbsp;#f1. Zero scroll&nbsp;hijacking.
            </p>
          </section>
        </section>

        {/* ================= HOW IT WORKS (Animated Specimens) ================= */}
        <section id="how" aria-labelledby="how-heading" className="border-t border-slate-200/80 bg-white py-20 sm:py-24">
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
        <section id="architecture" aria-labelledby="arch-heading" className="border-t border-slate-200/80 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="arch-heading"
              eyebrow="Under the Hood"
              title="Blocked by deterministic code, not prompt wishes"
              subtitle={"Even when an LLM tries to impress recruiters by inventing numbers, the 3-layer verification guard intercepts every token before it can be\u00A0saved."}
            />

            <div className="mt-12">
              <VerificationPipeline />
            </div>
          </div>
        </section>

        {/* ================= EMPIRICAL EVALUATION DATA ================= */}
        <section id="measured" aria-labelledby="measured-heading" className="border-t border-slate-200/80 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="measured-heading"
              eyebrow="Empirical Benchmarks"
              title="Measured, not promised"
              subtitle={"Tested across 40 real-world job postings. The AST code guard checks numbers, units, and technical\u00A0names."}
            />

            <BenchmarkMetrics />

            {/* Technical Boundary Callout (Strict Engineering Honesty) */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-600 shadow-2xs">
              <span className="font-semibold text-slate-800">Known Technical Boundary:</span> The guard
              evaluates numerical quantities, measurement units, and technology terminology. It flags
              semantic drift (e.g. inventing Redis when not in facts), but does not parse semantic noun
              context (e.g. &ldquo;120 members&rdquo; rewritten as &ldquo;120 customers&rdquo;). The user
              remains the ultimate reviewer of every generated bullet before PDF&nbsp;export.
            </div>
          </div>
        </section>

        {/* ================= ATS ANATOMY & COMPARISON MATRIX ================= */}
        <section id="comparison" aria-labelledby="comparison-heading" className="border-t border-slate-200/80 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="comparison-heading"
              eyebrow="Architectural Advantage"
              title="FactFit vs Unconstrained AI Resume Builders"
              subtitle={"Why deterministic code checks and single-column PDF structure outperform decorative templates and prompt\u2011only\u00A0AI."}
            />

            <div className="mt-12">
              <AtsAnatomy />
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 pl-6 pr-4">Evaluation Dimension</th>
                      <th className="px-4 py-3.5 text-red-800">Generic AI (ChatGPT / Claude)</th>
                      <th className="py-3.5 pr-6 pl-4 text-emerald-900">FactFit Verification Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="transition-colors hover:bg-slate-50/50">
                        <td className="py-3.5 pl-6 pr-4 font-medium whitespace-nowrap text-slate-900">{row.feature}</td>
                        <td className="px-4 py-3.5 text-red-700">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            {row.ai}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 pl-4 font-medium text-emerald-900">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            {row.factfit}
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
        <section className="border-t border-slate-200/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl sm:p-12">
              <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                    Start with one true&nbsp;sentence.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                    Log your achievements once, match against any job description, and export a clean
                    single-column PDF you can defend with total&nbsp;confidence.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/login"
                    className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-slate-900 shadow-sm hover:bg-slate-100 active:scale-[0.98]"
                  >
                    Tailor Resume with 0% Hallucination
                    <IconArrowDown className="-rotate-90 text-slate-700" size={16} />
                  </Link>
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
            <span>Zero-hallucination career tailoring</span>
          </div>
          <p>
            FactFit stores only what you enter. Fully PDPA compliant. Export or delete your data at any&nbsp;time.
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
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">{eyebrow}</p>
      <h2 id={id} className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 text-balance sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}
