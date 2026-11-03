import Link from "next/link";

const steps = [
  {
    title: "Write down what you actually did",
    body: "Short facts per job or project: what you did, what happened, the number that proves it, the tools you used.",
  },
  {
    title: "Paste a job description",
    body: "FactFit pulls out the skills and problems the employer cares about and shows which ones your facts already prove.",
  },
  {
    title: "Get bullets you can defend",
    body: "Every suggested bullet cites the facts it came from. Any number or technology that is not in those facts is blocked by code, not by trust.",
  },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { deleted } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <nav className="flex items-center justify-between">
        <span className="font-semibold tracking-tight">
          Fact<span className="text-emerald-700">Fit</span>
        </span>
        <Link href="/app" className="btn">
          Open app
        </Link>
      </nav>

      {deleted && (
        <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Your account and all of its data have been deleted.
        </p>
      )}

      <section className="py-16 sm:py-24">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Tailor your resume to each job without inventing a single fact.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-stone-600">
          AI resume writers make up numbers. FactFit matches your real experience to the job and refuses any sentence
          it cannot trace back to something you wrote.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login" className="btn-primary">
            Start your fact bank
          </Link>
        </div>
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card p-5">
            <span className="font-mono text-xs text-emerald-700">0{i + 1}</span>
            <h2 className="mt-2 font-medium">{s.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{s.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
