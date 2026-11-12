import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApplication, getFactBank } from "@/lib/data";
import { checkBullet } from "@/lib/core/guard";
import { matchRequirements } from "@/lib/core/match";
import { getLlm } from "@/lib/llm/provider";
import { IconAlert, IconCheck, IconDownload, IconMinus, IconShield } from "@/components/icons";
import { ScoreBadge } from "@/components/score-badge";
import { deleteApplicationAction } from "../../actions";
import { ConfirmButton } from "@/components/confirm-button";
import { BulletStudio } from "./bullet-studio";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params }: PageProps<"/app/applications/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [app, bank] = await Promise.all([getApplication(id), getFactBank()]);
  if (!app) notFound();

  const report = matchRequirements(app.analysis, bank.facts, bank.experiences);
  const factById = new Map(bank.facts.map((f) => [f.id, f]));
  const missing = report.matches.filter((m) => m.factIds.length === 0);
  const covered = report.matches.filter((m) => m.factIds.length > 0);
  const blockedBullets = app.bullets.filter((b) => !checkBullet(b, bank.facts, bank.experiences).ok).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <ScoreBadge score={report.score} size="lg" animate />
        <div className="min-w-[12rem] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-balance [overflow-wrap:anywhere]">{app.role || "Untitled role"}</h1>
            {blockedBullets > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 tabular-nums">
                <IconAlert size={12} /> {blockedBullets} blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 tabular-nums">
                <IconShield size={12} /> {app.bullets.length > 0 ? `${app.bullets.length} of ${app.bullets.length} traceable` : "Fact Guard Ready"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-slate-600 [overflow-wrap:anywhere]">{app.company || "Company not set"}</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {report.covered} of {report.total} requirements backed by your facts · analysed by {app.analyzedBy}
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <a href={`/app/applications/${app.id}/pdf`} className="btn-primary flex-1 sm:flex-initial">
            <IconDownload size={16} />
            Export PDF
          </a>
          <form action={deleteApplicationAction.bind(null, app.id)}>
            <ConfirmButton
              confirm={`Delete the application for ${app.role || "this role"}? Its saved bullets cannot be recovered.`}
              className="btn min-h-11 text-red-700 hover:border-red-300 hover:bg-red-50"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-5">
          <h2 className="font-medium">Backed by your facts</h2>
          {covered.length === 0 && <p className="mt-3 text-sm text-slate-500">No matches yet.</p>}
          <ul className="mt-3 space-y-3">
            {covered.map((m) => (
              <li key={m.requirement.name} className="text-sm">
                <RequirementName requirement={m.requirement} tone="ok" />
                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-slate-600">
                  {m.factIds.slice(0, 3).map((fid) => (
                    <li key={fid} className="line-clamp-2 [overflow-wrap:anywhere]">
                      ↳ {factById.get(fid)?.did}
                    </li>
                  ))}
                  {m.factIds.length > 3 && <li>↳ and {m.factIds.length - 3} more</li>}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="card p-5">
            <h2 className="font-medium">Not in your fact bank</h2>
            {missing.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Every requirement has evidence.</p>
            ) : (
              <>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {missing.map((m) => (
                    <li key={m.requirement.name}>
                      <RequirementName requirement={m.requirement} tone="missing" />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  If you really have done one of these, <Link href="/app/facts" className="font-medium text-slate-700 underline underline-offset-2">add it as a fact</Link>.
                  Otherwise leave it out. FactFit will not write it for&nbsp;you.
                </p>
              </>
            )}
          </div>
          {app.analysis.problems.length > 0 && (
            <div className="card p-5">
              <h2 className="font-medium">What they want solved</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 [overflow-wrap:anywhere]">
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
  // A missing skill is a gap, not an error: dashed and neutral, paired with IconMinus so color is never sole cue.
  const colour =
    tone === "ok" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/15" : "border border-dashed border-slate-300 bg-white text-slate-700";
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-sm [overflow-wrap:anywhere] ${colour}`}>
      {tone === "ok" ? <IconCheck size={13} className="shrink-0 text-emerald-700" /> : <IconMinus size={13} className="shrink-0 text-slate-400" />}
      <span>{r.name}</span>
      {r.importance === "preferred" && <span className="text-xs text-slate-500">nice to have</span>}
    </span>
  );
}
