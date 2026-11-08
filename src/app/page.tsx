import Link from "next/link";
import { demoEmail } from "@/lib/supabase/admin";
import { ProofDemo } from "@/components/proof-demo";
import { Reveal } from "@/components/reveal";
import { IconArrowDown, IconLayers, IconSearch, IconShield } from "@/components/icons";
import { DemoButton } from "./login/demo-button";

const steps = [
  {
    icon: IconLayers,
    title: "Write down what you actually did",
    body: "Short facts per job or project: what you did, what changed, the number that proves it, the tools you used.",
  },
  {
    icon: IconSearch,
    title: "Paste a job description",
    body: "FactFit lists the skills and problems the employer cares about and shows which ones your facts already prove.",
  },
  {
    icon: IconShield,
    title: "Keep only bullets you can defend",
    body: "Every bullet cites the facts it came from. A number or tool that is not in those facts is blocked by code, not by trust.",
  },
];

// From eval/README.md (40 fictional cases). Update both together.
const results = [
  { value: "547 / 547", label: "Invented numbers, tools and citations blocked on the 30 tuning cases" },
  { value: "180 / 186", label: "Blocked on 10 held-out cases written after the guard was frozen" },
  { value: "26 / 26", label: "Invented claims blocked when a free model was told to “add impressive metrics”" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;
  const demo = Boolean(demoEmail());

  return (
    <div className="flex-1 bg-white">
      <div className="hero-band text-white">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight">
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-white text-[13px] font-bold text-slate-800">
              F
            </span>
            <span>
              Fact<span className="text-emerald-300">Fit</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="press inline-flex min-h-10 items-center rounded-lg border border-white/25 px-4 text-sm font-medium text-white hover:bg-white/10"
          >
            Sign in
          </Link>
        </header>

        {deleted && (
          <p role="status" className="mx-auto max-w-6xl px-4 sm:px-6">
            <span className="block rounded-lg bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/20">
              Your FactFit data has been deleted.
            </span>
          </p>
        )}

        <section className="mx-auto max-w-3xl px-4 pt-14 pb-40 text-center sm:px-6 sm:pt-20 sm:pb-48">
          <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl">
            Tailor your resume to each job without inventing a single fact.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-slate-200">
            AI resume writers make up numbers. FactFit matches your real experience to the posting and refuses any
            sentence it cannot trace back to something you wrote.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="btn-light">
              Start your fact bank
            </Link>
            {demo && (
              <DemoButton
                className="press inline-flex min-h-11 items-center rounded-lg border border-white/25 px-5 text-[15px] font-medium text-white hover:bg-white/10"
                label="Try the demo"
              />
            )}
          </div>
          {demo && <p className="mt-4 text-xs text-slate-300">The demo is a shared account with a fictional person. No&nbsp;sign&#8209;up.</p>}
        </section>
      </div>

      <main>
        {/* The guard demo overlaps the hero band the way the template's card stack does. */}
        <section aria-label="Try the fabrication guard" className="relative z-10 mx-auto -mt-28 max-w-3xl px-4 sm:-mt-36 sm:px-6">
          <ProofDemo />
          <p className="mt-3 text-center text-xs text-slate-500">The real guard, running in your browser on a fictional fact.</p>
        </section>

        <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 pt-24 pb-20 sm:px-6">
          <SectionHeader id="how" title="How it works">
            Three steps from what you did to a one-page PDF that ATS can read. Nothing on it is something you did not
            write first.
          </SectionHeader>
          <Reveal as="ol" className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} style={{ "--i": i } as React.CSSProperties} className="card p-6">
                <div className="flex items-start justify-between">
                  <span className="icon-tile">
                    <Icon size={20} />
                  </span>
                  <span className="text-right text-xs text-slate-500">
                    Step
                    <span className="block font-medium text-slate-700 tabular-nums">0{i + 1}</span>
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-medium tracking-tight text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
              </li>
            ))}
          </Reveal>
        </section>

        <section aria-labelledby="measured" className="bg-slate-100">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHeader id="measured" title="Measured, not promised">
              Tested on 40 fictional postings. Its known gap: it checks numbers and names, not what a number counts, so
              &ldquo;120 members&rdquo; rewritten as &ldquo;120 bookings&rdquo; gets through. You still read every bullet.
            </SectionHeader>
            <Reveal as="dl" className="mt-10 grid gap-4 sm:grid-cols-3">
              {results.map((r, i) => (
                <div key={r.value} style={{ "--i": i } as React.CSSProperties} className="card p-6">
                  <dt className="sr-only">{r.label}</dt>
                  <dd className="text-4xl font-medium tracking-tight text-slate-900 tabular-nums">{r.value}</dd>
                  <dd className="mt-3 text-sm leading-relaxed text-slate-600">{r.label}</dd>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        <section className="hero-band text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-3xl font-medium tracking-tight">Start with one true sentence.</h2>
              <p className="mt-2 text-slate-300">Add a fact, paste a posting, export a one-page PDF.</p>
            </div>
            <Link href="/login" className="btn-light">
              Start your fact bank
              <IconArrowDown className="-rotate-90" size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-xs text-slate-500 sm:px-6">
        <span className="font-semibold tracking-tight text-slate-800">
          Fact<span className="text-emerald-700">Fit</span>
        </span>
        <p>FactFit stores only what you type. Export or delete it any time.</p>
      </footer>
    </div>
  );
}

function SectionHeader({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-end md:gap-12">
      <h2 id={id} className="text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-lg text-sm leading-relaxed text-slate-600 md:justify-self-end">{children}</p>
    </div>
  );
}
