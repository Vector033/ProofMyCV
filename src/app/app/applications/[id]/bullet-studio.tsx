"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { checkBullet, describeViolation } from "@/lib/core/guard";
import { factAsBullet } from "@/lib/core/bullets";
import type { BulletDraft, Experience, Fact } from "@/lib/core/types";
import type { BulletCandidate } from "@/lib/llm/tasks";
import { generateBulletsAction, saveBulletsAction } from "../../actions";

type Props = {
  applicationId: string;
  experiences: Experience[];
  facts: Fact[];
  initialBullets: BulletDraft[];
  canGenerate: boolean;
};

export function BulletStudio({ applicationId, experiences, facts, initialBullets, canGenerate }: Props) {
  const [bullets, setBullets] = useState<BulletDraft[]>(initialBullets);
  const [candidates, setCandidates] = useState<BulletCandidate[]>([]);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [removed, setRemoved] = useState<{ bullet: BulletDraft; index: number } | null>(null);
  const [generating, startGenerating] = useTransition();
  const [saving, startSaving] = useTransition();

  // The same guard the server runs on save, run live while the user edits.
  const checks = useMemo(() => bullets.map((b) => checkBullet(b, facts, experiences)), [bullets, facts, experiences]);
  const blockedCount = checks.filter((c) => !c.ok).length;
  const blocked = blockedCount > 0;
  const factById = useMemo(() => new Map(facts.map((f) => [f.id, f])), [facts]);

  // Unsaved edits would be lost on leaving; let the browser ask first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (next: BulletDraft[]) => {
    setBullets(next);
    setDirty(true);
    setStatus(null);
    setRemoved(null);
  };
  const has = (text: string) => bullets.some((x) => x.text === text);
  const add = (b: BulletDraft) => {
    if (has(b.text)) return;
    update([...bullets, { experienceId: b.experienceId, text: b.text, factIds: b.factIds }]);
  };
  const remove = (i: number) => {
    update(bullets.filter((_, k) => k !== i));
    setRemoved({ bullet: bullets[i], index: i });
  };
  const undoRemove = () => {
    if (!removed) return;
    const next = [...bullets];
    next.splice(removed.index, 0, removed.bullet);
    update(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= bullets.length || bullets[j].experienceId !== bullets[i].experienceId) return;
    const next = [...bullets];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const generate = () =>
    startGenerating(async () => {
      setStatus(null);
      const r = await generateBulletsAction(applicationId);
      if (r.error) setStatus({ tone: "error", text: r.error });
      else {
        setCandidates(r.candidates ?? []);
        const n = r.candidates?.filter((c) => !c.guard.ok).length ?? 0;
        setStatus({ tone: "ok", text: `${r.candidates?.length ?? 0} drafts, ${n} blocked by the fabrication guard.` });
      }
    });

  const save = () =>
    startSaving(async () => {
      const r = await saveBulletsAction(applicationId, bullets);
      if (r.error) setStatus({ tone: "error", text: r.error });
      else {
        setDirty(false);
        setStatus({ tone: "ok", text: "Saved. Export the PDF when you are happy with it." });
      }
    });

  const summary =
    bullets.length === 0
      ? "Nothing on this version yet."
      : blocked
        ? `${blockedCount} of ${bullets.length} blocked. Fix or remove ${blockedCount === 1 ? "it" : "them"} to save.`
        : `${bullets.length} ${bullets.length === 1 ? "bullet" : "bullets"}, all traceable to your facts.`;

  return (
    <section aria-labelledby="bullets-heading" className="space-y-4">
      <div className="fluted-glass z-[5] md:sticky md:top-16 -mx-4 flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="mr-auto min-w-0">
          <h2 id="bullets-heading" className="text-lg font-semibold tracking-tight">
            Bullets for this job
          </h2>
          <p className={`text-xs tabular-nums ${blocked ? "text-red-800" : "text-slate-600"}`} aria-live="polite">
            {summary}
            {dirty && !blocked && bullets.length > 0 && " Save to include these edits in the PDF."}
          </p>
        </div>
        <button onClick={generate} disabled={!canGenerate || generating} className="btn">
          {generating ? "Drafting…" : "Draft with AI"}
        </button>
        <button onClick={save} disabled={!dirty || blocked || saving} className="btn-primary">
          {saving ? "Saving…" : dirty ? "Save version" : "Saved"}
        </button>
      </div>
      {!canGenerate && (
        <p className="text-xs text-slate-500">AI drafting is off on this server. Add facts as written, then reword them.</p>
      )}
      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={`rounded-md px-3 py-2 text-sm ${status.tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`}
        >
          {status.text}
        </p>
      )}
      {removed && (
        <p role="status" className="flex flex-wrap items-center gap-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
          Bullet removed.
          <button onClick={undoRemove} className="font-medium text-slate-900 underline underline-offset-2">
            Undo
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: the resume version being built */}
        <div className="min-w-0 space-y-4">
          <p className="eyebrow">This version</p>
          {experiences.map((e) => {
            const rows = bullets.map((b, i) => ({ b, i })).filter(({ b }) => b.experienceId === e.id);
            return (
              <div key={e.id} className="card relative overflow-hidden p-4">
                <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-900 [overflow-wrap:anywhere]">
                    {e.title} {e.org && <span className="font-normal text-slate-500">· {e.org}</span>}
                  </p>
                  {rows.length === 0 && <p className="mt-2 text-xs text-slate-500">Not on this version.</p>}
                  <ul className="mt-3 space-y-2">
                    {rows.map(({ b, i }, k) => {
                      const check = checks[i];
                      return (
                        <li
                          key={i}
                          className={`rounded-lg border p-3 transition-colors duration-150 ${
                            check.ok
                              ? "border-slate-200 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15"
                              : "border-red-300 bg-red-50/40 focus-within:ring-2 focus-within:ring-red-600/15"
                          }`}
                        >
                          <textarea
                            value={b.text}
                            rows={2}
                            onChange={(ev) => update(bullets.map((x, n) => (n === i ? { ...x, text: ev.target.value } : x)))}
                            className="w-full resize-y bg-transparent text-base leading-relaxed text-slate-900 [field-sizing:content] focus:outline-none focus-visible:outline-none sm:text-sm"
                            aria-label={`Bullet ${k + 1} for ${e.title}`}
                            aria-invalid={!check.ok}
                            aria-describedby={check.ok ? undefined : `bullet-${i}-problems`}
                          />
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <GuardBadge ok={check.ok} />
                            <span className="text-slate-500">
                              cites {b.factIds.length} fact{b.factIds.length === 1 ? "" : "s"}
                            </span>
                            <span className="ml-auto flex gap-0.5">
                              <button onClick={() => move(i, -1)} disabled={k === 0} className="btn-ghost" aria-label={`Move bullet ${k + 1} up`}>
                                <Arrow up />
                              </button>
                              <button
                                onClick={() => move(i, 1)}
                                disabled={k === rows.length - 1}
                                className="btn-ghost"
                                aria-label={`Move bullet ${k + 1} down`}
                              >
                                <Arrow />
                              </button>
                              <button onClick={() => remove(i)} className="btn-danger" aria-label={`Remove bullet ${k + 1}`}>
                                Remove
                              </button>
                            </span>
                          </div>
                          <Problems check={check} id={`bullet-${i}-problems`} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
          {experiences.length === 0 && <p className="text-sm text-slate-600">Add experience to your fact bank first.</p>}
        </div>

        {/* Right: sources to add from */}
        <div className="min-w-0 space-y-4">
          <p className="eyebrow">Add from</p>
          {candidates.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-medium text-slate-900">AI drafts</p>
              <ul className="mt-3 space-y-2">
                {candidates.map((c, i) => (
                  <li key={i} className={`rounded-lg border p-3 text-sm ${c.guard.ok ? "border-slate-200" : "border-red-200 bg-red-50/50"}`}>
                    <p className={`leading-relaxed ${c.guard.ok ? "text-slate-900" : "text-slate-500 line-through decoration-red-400"}`}>
                      {c.text}
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-slate-500">
                      {c.factIds.map((id) => (
                        <li key={id} className="line-clamp-2 [overflow-wrap:anywhere]">
                          ↳ {factById.get(id)?.did ?? `unknown fact ${id}`}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <GuardBadge ok={c.guard.ok} />
                      {c.guard.ok && (
                        <button onClick={() => add(c)} disabled={has(c.text)} className="btn btn-sm ml-auto">
                          {has(c.text) ? "Added" : "Add"}
                        </button>
                      )}
                    </div>
                    <Problems check={c.guard} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-4">
            <p className="text-sm font-medium text-slate-900">Your facts, as written</p>
            <p className="mt-0.5 text-xs text-slate-500">Always safe. Add one, then reword it on the left; the guard keeps checking.</p>
            <ul className="mt-3 divide-y divide-slate-100">
              {facts.map((f) => {
                const draft = factAsBullet(f);
                return (
                  <li key={f.id} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 leading-relaxed text-slate-700 [overflow-wrap:anywhere]">{draft.text}</span>
                    <button onClick={() => add(draft)} disabled={has(draft.text)} className="btn btn-sm shrink-0">
                      {has(draft.text) ? "Added" : "Add"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`fill-none stroke-current stroke-2 ${up ? "" : "rotate-180"}`}>
      <path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GuardBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-600/20">
      ✓ Traceable
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-800 ring-1 ring-red-600/20">
      ✕ Blocked
    </span>
  );
}

function Problems({ check, id }: { check: ReturnType<typeof checkBullet>; id?: string }) {
  if (check.violations.length === 0 && check.warnings.length === 0) return null;
  return (
    <ul id={id} className="mt-2 space-y-0.5 text-xs">
      {check.violations.map((v, i) => (
        <li key={i} className="text-red-800">
          {describeViolation(v)}
        </li>
      ))}
      {check.warnings.map((w, i) => (
        <li key={`w${i}`} className="text-amber-800">
          {w.type === "too-long" ? `${w.words} words; aim for 30 or fewer` : `Starts with "${w.word}"; lead with what you did`}
        </li>
      ))}
    </ul>
  );
}
