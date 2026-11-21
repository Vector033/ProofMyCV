import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApplication, getFactBank } from "@/lib/data";
import { checkBullet } from "@/lib/core/guard";
import { matchRequirements } from "@/lib/core/match";
import { getLlm } from "@/lib/llm/provider";
import { IconAlert, IconCheck, IconDownload, IconMinus, IconShield } from "@/components/icons";
import { ScoreBadge } from "@/components/score-badge";
import { deleteApplicationAction, quickAddFactAction, reanalyseApplicationAction, updateStatusAction } from "../../actions";
import { APPLICATION_STATUSES, STATUS_LABEL } from "@/lib/core/types";
import { CAREER_TRACKS } from "@/lib/core/jd";
import { canonicalTech } from "@/lib/core/vocab";
import { TechChips } from "../../facts/tech-chips";
import { PdfPreview } from "./pdf-preview";
import { ReanalyseButton } from "./reanalyse-button";
import { ConfirmButton } from "@/components/confirm-button";
import { BulletStudio } from "./bullet-studio";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({ params, searchParams }: PageProps<"/app/applications/[id]">) {
  const { id } = await params;
  const { reanalysed } = await searchParams;
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
          <form action={reanalyseApplicationAction.bind(null, app.id)} className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <label htmlFor="reanalyse-track">Analyse again for</label>
            <select id="reanalyse-track" name="track" defaultValue="" className="input w-auto py-1 text-xs sm:text-xs">
              <option value="">any track</option>
              {CAREER_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ReanalyseButton />
          </form>
          {reanalysed === "1" && (
            <p role="status" className="mt-2 text-xs text-emerald-800">
              Analysed again. Your bullets are unchanged.
            </p>
          )}
          {reanalysed === "failed" && (
            <p role="alert" className="mt-2 text-xs text-red-800">
              The AI could not analyse the posting just now, so the earlier analysis is kept. Try again in a minute.
            </p>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <a href={`/app/applications/${app.id}/pdf`} className="btn-primary flex-1 sm:flex-initial">
            <IconDownload size={16} />
            Export PDF
          </a>
          <PdfPreview href={`/app/applications/${app.id}/pdf`} />
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

      <form action={updateStatusAction.bind(null, app.id)} className="card flex flex-wrap items-end gap-3 p-4">
        <label className="block">
          <span className="label">Status</span>
          <select name="status" defaultValue={app.status} className="input w-auto">
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Deadline</span>
          <input type="date" name="deadline" defaultValue={app.deadline ?? ""} className="input w-auto tabular-nums" />
        </label>
        <label className="block min-w-0 flex-1 basis-56">
          <span className="label">Note</span>
          <input name="statusNote" maxLength={200} defaultValue={app.statusNote} placeholder="e.g. Online test 6–12 Jan" className="input" />
        </label>
        <button className="btn">Save status</button>
      </form>

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
                  If you really have done one of these, add it as a fact below or in your{" "}
                  <Link href="/app/facts" className="font-medium text-slate-700 underline underline-offset-2">fact bank</Link>. Otherwise leave it out.
                  ProofMyCV will not write it for&nbsp;you.
                </p>
                {bank.experiences.length > 0 && (
                  <details className="group/quick mt-4 rounded-lg border border-slate-200 p-3">
                    <summary className="flex min-h-8 cursor-pointer list-none items-center text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
                      <span className="group-open/quick:hidden">+ Add a fact you really have</span>
                      <span className="hidden group-open/quick:inline">Close</span>
                    </summary>
                    <form action={quickAddFactAction.bind(null, app.id)} className="mt-3 grid gap-3">
                      <label className="block">
                        <span className="label">Where you did it</span>
                        <select name="experienceId" required className="input">
                          {bank.experiences.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.title}
                              {e.org ? ` · ${e.org}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="label">What you did</span>
                        <textarea name="did" required minLength={3} rows={2} placeholder="In your own words, only what really happened" className="input" />
                      </label>
                      <label className="block">
                        <span className="label">Result (with the number, if there is one)</span>
                        <input name="result" className="input" />
                      </label>
                      <TechChips suggestions={missing.map((m) => canonicalTech(m.requirement.name) ?? m.requirement.name).slice(0, 12)} />
                      <div>
                        <button className="btn">Add fact</button>
                      </div>
                    </form>
                  </details>
                )}
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
