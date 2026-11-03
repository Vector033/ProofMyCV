import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApplication, getFactBank } from "@/lib/data";
import { matchRequirements } from "@/lib/core/match";
import { getLlm } from "@/lib/llm/provider";
import { ScoreBadge } from "@/components/score-badge";
import { deleteApplicationAction } from "../../actions";
import { BulletStudio } from "./bullet-studio";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params }: PageProps<"/app/applications/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [app, bank] = await Promise.all([getApplication(id), getFactBank()]);
  if (!app) notFound();

  const report = matchRequirements(app.analysis, bank.facts);
  const factById = new Map(bank.facts.map((f) => [f.id, f]));
  const missing = report.matches.filter((m) => m.factIds.length === 0);
  const covered = report.matches.filter((m) => m.factIds.length > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-5">
        <ScoreBadge score={report.score} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{app.role || "Untitled role"}</h1>
          <p className="text-stone-600">{app.company || "Company not set"}</p>
          <p className="mt-1 text-xs text-stone-500">
            {report.covered} of {report.total} requirements backed by your facts · analysed by {app.analyzedBy}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/app/applications/${app.id}/pdf`} className="btn-primary">
            Export PDF
          </a>
          <form action={deleteApplicationAction.bind(null, app.id)}>
            <button className="btn">Delete</button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-medium">Backed by your facts</h2>
          {covered.length === 0 && <p className="mt-3 text-sm text-stone-500">No matches yet.</p>}
          <ul className="mt-3 space-y-3">
            {covered.map((m) => (
              <li key={m.requirement.name} className="text-sm">
                <RequirementName requirement={m.requirement} tone="ok" />
                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-stone-600">
                  {m.factIds.slice(0, 3).map((fid) => (
                    <li key={fid} className="truncate">
                      ↳ {factById.get(fid)?.did}
                    </li>
                  ))}
                  {m.factIds.length > 3 && <li>↳ and {m.factIds.length - 3} more</li>}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-medium">Not in your fact bank</h2>
            {missing.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Every requirement has evidence.</p>
            ) : (
              <>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {missing.map((m) => (
                    <li key={m.requirement.name}>
                      <RequirementName requirement={m.requirement} tone="missing" />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-stone-500">
                  If you really have done one of these, <Link href="/app/facts" className="underline">add it as a fact</Link>.
                  Otherwise leave it out. FactFit will not write it for you.
                </p>
              </>
            )}
          </div>
          {app.analysis.problems.length > 0 && (
            <div className="card p-5">
              <h2 className="font-medium">What they want solved</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
                {app.analysis.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <BulletStudio
        applicationId={app.id}
        experiences={bank.experiences}
        facts={bank.facts}
        initialBullets={app.bullets}
        canGenerate={getLlm() !== null}
      />
    </div>
  );
}

function RequirementName({
  requirement: r,
  tone,
}: {
  requirement: { name: string; importance: "required" | "preferred" };
  tone: "ok" | "missing";
}) {
  const colour = tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm ${colour}`}>
      {r.name}
      {r.importance === "preferred" && <span className="text-[10px] uppercase opacity-70">nice to have</span>}
    </span>
  );
}
