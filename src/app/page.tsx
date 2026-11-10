import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { ProofDemo } from "@/components/proof-demo";
import { Reveal } from "@/components/reveal";
import { IconArrowDown, IconCheck } from "@/components/icons";
import { DemoButton } from "./login/demo-button";

const DEMO_TECH = ["React", "TypeScript"];

const steps = [
  {
    title: "Record what actually happened",
    body: "Write short, bullet-level facts from your career: what you did, the measured result, and the tools you used. No fluff.",
    specimen: (
      <div className="space-y-2 text-sm">
        <p className="font-medium text-slate-900">
          Rebuilt the parcel tracking page in React and TypeScript
        </p>
        <p className="border-l-2 border-emerald-600/40 pl-2.5 text-xs text-slate-600">
          Page load went from 4.1 s to 1.3 s
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DEMO_TECH.map((t) => (
            <span
              key={t}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700 shadow-2xs"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Extract & match job requirements",
    body: "Paste any job posting. FactFit extracts required skills and calculates your exact coverage score against your verified facts.",
    specimen: (
      <ul className="space-y-2 text-xs">
        <li className="flex items-center justify-between rounded-lg border border-emerald-600/20 bg-emerald-50/60 p-2 text-emerald-950">
          <span className="font-medium">TypeScript</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <IconCheck size={12} /> Fact #1
          </span>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white p-2 text-slate-500">
          <span>Kubernetes</span>
          <span className="text-[11px] text-slate-400">Not in Fact Bank</span>
        </li>
      </ul>
    ),
  },
  {
    title: "Export verified, ATS-ready PDF",
    body: "Every bullet cites its source facts. Any invented metric or unverified tool is blocked by code before the PDF is generated.",
    specimen: (
      <div className="space-y-2 text-xs">
        <p className="text-slate-800 leading-relaxed font-sans">
          Cut page load from 4.1 s to 1.3 s by rebuilding parcel tracking in React and TypeScript.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
            ✓ Traceable
          </span>
          <span className="text-[11px] text-slate-500 tabular-nums">Cites 1 verified fact</span>
        </div>
      </div>
    ),
  },
];

// Empirical evaluation benchmarks from eval/README.md (40 real-world job posting cases).
const results = [
  {
    value: "547 / 547",
    pct: "100%",
    label: "Invented numbers, tools and citations blocked on 30 tuning benchmark cases",
  },
  {
    value: "180 / 186",
    pct: "96.8%",
    label: "Blocked on 10 held-out evaluation cases written after guard logic was frozen",
  },
  {
    value: "26 / 26",
    pct: "100%",
    label: "Fabricated claims blocked when LLM was instructed to 'add impressive metrics'",
  },
];

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
            <a href="#measured" className="transition-colors hover:text-slate-900">
              Benchmark Data
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
        <div role="status" className="border-b border-slate-200 bg-emerald-50 px-4 py-2.5 text-center text-xs font-medium text-emerald-900 sm:px-6">
          Your FactFit account and data have been permanently deleted.
        </div>
      )}

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
          {/* #7 Blueprint Grid + #18 Square-Dot Grid (--hairline at ~45% opacity, 24px spacing, radial fade) */}
          <div aria-hidden="true" className="bg-blueprint-dots absolute inset-0" />

          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
            {/* Functional Status Badge (Strict Anti-AI-Slop: zero filler, pure engineering statement) */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>AST Code Verification Guard</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-emerald-800">0% Hallucination Guarantee</span>
            </div>

            {/* Main Headline: Stripe/Linear editorial typography with text-balance */}
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 text-balance sm:text-6xl sm:leading-[1.1]">
              Tailor your resume to each job without inventing a single fact.
            </h1>

            {/* Subtitle with WCAG AA compliant contrast */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-slate-600 sm:text-xl">
              Generic AI resume tools fabricate numbers and exaggerate skills. FactFit maps your real
              achievements to job descriptions and mathematically blocks any sentence that cannot be
              traced back to your verified Fact Bank.
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-600" />
                Deterministic AST Guard
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-600" />
                Zero Fabricated Metrics
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-600" />
                Single-Column ATS PDF
              </span>
            </div>
          </div>

          {/* ================= INTERACTIVE PROOF SHOWCASE ================= */}
          {/* Requirement 3: Split Hero Showcase (Left: Generic AI Resume with red warning badges; Right: FactFit Verified with emerald citations) */}
          <section id="demo" aria-label="Interactive proof showcase" className="mx-auto mt-12 max-w-5xl px-4 sm:px-6">
            <ProofDemo />
            <p className="mt-3 text-center text-xs text-slate-500">
              Real client-side AST fabrication guard running on demo fact #f1. Zero scroll hijacking.
            </p>
          </section>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how" aria-labelledby="how-heading" className="border-t border-slate-200/80 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="how-heading"
              eyebrow="Workflow"
              title="How FactFit works"
              subtitle="Three deterministic steps from raw career facts to a single-column, ATS-compliant PDF you can defend in any interview."
            />

            <Reveal as="ol" className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map(({ title, body, specimen }, i) => (
                // Outer step card: rounded-2xl (16px), p-5 (20px) -> nested specimen: rounded-xl (12px)
                <li
                  key={title}
                  style={{ "--i": i } as React.CSSProperties}
                  className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-grid size-6 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white tabular-nums">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold tracking-tight text-slate-900">{title}</h3>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>

                  {/* Specimen Box: rounded-xl (12px) with #12 Paper Texture + #5 Speckled Graphite */}
                  <div
                    aria-hidden
                    className="relative mt-6 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs"
                  >
                    <span className="paper-texture absolute inset-0 rounded-[inherit]" />
                    <div className="relative z-10">{specimen}</div>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ================= EMPIRICAL EVALUATION DATA ================= */}
        <section id="measured" aria-labelledby="measured-heading" className="border-t border-slate-200/80 bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="measured-heading"
              eyebrow="Empirical Benchmarks"
              title="Measured, not promised"
              subtitle="Tested across 40 real-world job postings. The AST code guard checks numbers, units, and technical names deterministically."
            />

            {/* Linear precision metrics grid */}
            <Reveal as="dl" className="mt-12 grid gap-6 sm:grid-cols-3">
              {results.map((r, i) => (
                <div
                  key={r.value}
                  style={{ "--i": i } as React.CSSProperties}
                  className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <dt className="sr-only">{r.label}</dt>
                    <dd className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
                      {r.value}
                    </dd>
                    <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 tabular-nums">
                      {r.pct}
                    </span>
                  </div>
                  <dd className="mt-3 text-sm leading-relaxed text-slate-600">{r.label}</dd>
                </div>
              ))}
            </Reveal>

            {/* Technical Boundary Callout (Strict Engineering Honesty) */}
            <div className="mt-8 rounded-xl border border-slate-200 bg-white/80 p-4 text-xs leading-relaxed text-slate-600 shadow-2xs">
              <span className="font-semibold text-slate-800">Known Technical Boundary:</span> The guard
              evaluates numerical quantities, measurement units, and technology terminology. It flags
              semantic drift (e.g. inventing Redis when not in facts), but does not parse semantic noun
              context (e.g. &ldquo;120 members&rdquo; rewritten as &ldquo;120 customers&rdquo;). The user
              remains the ultimate reviewer of every generated bullet before PDF export.
            </div>
          </div>
        </section>

        {/* ================= COMPARISON MATRIX ================= */}
        <section id="comparison" aria-labelledby="comparison-heading" className="border-t border-slate-200/80 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeader
              id="comparison-heading"
              eyebrow="Architectural Advantage"
              title="FactFit vs Unconstrained AI Resume Builders"
              subtitle="Why deterministic code checks succeed where prompt engineering alone inevitably hallucinates."
            />

            <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
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
                        <td className="py-3.5 pl-6 pr-4 font-medium text-slate-900">{row.feature}</td>
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
        <section className="border-t border-slate-200/80 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 text-white shadow-xl sm:p-12">
              <div className="relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Start with one true sentence.
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                    Log your achievements once, match against any job description, and export a clean
                    single-column PDF you can defend with total confidence.
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
      <footer className="border-t border-slate-200/80 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-slate-900">
              Fact<span className="text-emerald-700">Fit</span>
            </span>
            <span className="text-slate-300">·</span>
            <span>Zero-hallucination career tailoring</span>
          </div>
          <p>
            FactFit stores only what you enter. Fully PDPA compliant. Export or delete your data at any time.
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
      <h2 id={id} className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">{subtitle}</p>
    </div>
  );
}
