import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { ProofDemo } from "@/components/proof-demo";
import { Reveal } from "@/components/reveal";
import { DemoButton } from "./login/demo-button";

const steps = [
  {
    title: "Write down what you actually did",
    body: "Short facts per job or project: what you did, what changed, the number that proves it, the tools you used.",
  },
  {
    title: "Paste a job description",
    body: "FactFit lists the skills and problems the employer cares about and shows which ones your facts already prove.",
  },
  {
    title: "Keep only bullets you can defend",
    body: "Every bullet cites the facts it came from. A number or tool that is not in those facts is blocked by code, not by trust.",
  },
];

// From eval/README.md (40 fictional cases). Update both together.
const results = [
  { value: "547 / 547", label: "invented numbers, tools and citations blocked on the 30 tuning cases" },
  { value: "180 / 186", label: "blocked on 10 held-out cases written after the guard was frozen" },
  { value: "0", label: "honest bullets wrongly blocked across both sets" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;
  const demo = Boolean(demoEmail());

  return (
    <div className="flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn">
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        {deleted && (
          <p role="status" className="mx-auto mt-2 max-w-6xl px-4 sm:px-6">
            <span className="block rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-600/15">
              Your FactFit data has been deleted.
            </span>
          </p>
        )}

        <section className="hero-glow mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:pb-28">
          <div>
            <p className="eyebrow text-emerald-800">Resume tailoring with a fabrication guard</p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-stone-900 sm:text-5xl">
              Tailor your resume to each job without inventing a single fact.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-pretty text-stone-600">
              AI resume writers make up numbers. FactFit matches your real experience to the posting and refuses any
              sentence it cannot trace back to something you wrote.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn-primary min-h-11 px-5 text-[15px] hover:shadow-md hover:shadow-emerald-900/15">
                Start your fact bank
              </Link>
              {demo && <DemoButton className="btn min-h-11 px-5 text-[15px]" label="Try the demo" />}
            </div>
            {demo && <p className="mt-3 text-xs text-stone-500">The demo is a shared account with a fictional person. No sign‑up.</p>}
          </div>

          <div>
            <ProofDemo />
            <p className="mt-3 text-xs text-stone-500">The real guard, running in your browser on a fictional fact.</p>
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-stone-200/80 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="how" className="eyebrow">
              How it works
            </h2>
            <Reveal as="ol" className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {steps.map((s, i) => (
                <li key={s.title} style={{ "--i": i } as React.CSSProperties} className="border-t border-stone-900 pt-5">
                  <span className="font-mono text-xs text-emerald-800">0{i + 1}</span>
                  <h3 className="mt-3 text-lg font-medium tracking-tight text-stone-900">{s.title}</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-600">{s.body}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        <section aria-labelledby="measured" className="border-t border-stone-200/80">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="max-w-xl">
              <h2 id="measured" className="text-2xl font-semibold tracking-tight text-stone-900">
                Measured, not promised
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                The guard is tested on 40 fictional postings with hand-written fabrications. Its known gap: it checks
                numbers and names, not what a number counts, so &ldquo;120 members&rdquo; rewritten as &ldquo;120
                bookings&rdquo; gets through. You still read every bullet.
              </p>
            </div>
            <Reveal as="dl" className="mt-10 grid gap-px overflow-hidden rounded-xl border border-stone-200/80 bg-stone-200/80 sm:grid-cols-3">
              {results.map((r, i) => (
                <div key={r.value} style={{ "--i": i } as React.CSSProperties} className="bg-white p-6">
                  <dt className="sr-only">{r.label}</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-stone-900 tabular-nums">{r.value}</dd>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">{r.label}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="border-t border-stone-200/80 bg-stone-900 text-stone-100">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Start with one true sentence.</h2>
              <p className="mt-2 text-sm text-stone-400">Add a fact, paste a posting, export a one-page PDF that ATS can read.</p>
            </div>
            <Link href="/login" className="btn-primary min-h-11 px-5 text-[15px]">
              Start your fact bank
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-xs text-stone-500 sm:px-6">
        <Logo />
        <p>FactFit stores only what you type. Export or delete it any time.</p>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="rounded-sm font-semibold tracking-tight text-stone-900">
      Fact<span className="text-emerald-700">Fit</span>
    </Link>
  );
}
