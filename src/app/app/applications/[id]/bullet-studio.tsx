"use client";

import { useMemo, useState, useTransition } from "react";
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
  const [generating, startGenerating] = useTransition();
  const [saving, startSaving] = useTransition();

  // The same guard the server runs on save, run live while the user edits.
  const checks = useMemo(() => bullets.map((b) => checkBullet(b, facts, experiences)), [bullets, facts, experiences]);
  const blocked = checks.some((c) => !c.ok);
  const factById = useMemo(() => new Map(facts.map((f) => [f.id, f])), [facts]);

  const update = (next: BulletDraft[]) => {
    setBullets(next);
    setDirty(true);
    setStatus(null);
  };
  const add = (b: BulletDraft) => {
    if (bullets.some((x) => x.text === b.text)) return;
    update([...bullets, { experienceId: b.experienceId, text: b.text, factIds: b.factIds }]);
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-lg font-semibold tracking-tight">Bullets for this job</h2>
        <button onClick={generate} disabled={!canGenerate || generating} className="btn" title={canGenerate ? "" : "Set GEMINI_API_KEY to enable"}>
          {generating ? "Drafting…" : "Draft with AI"}
        </button>
        <button onClick={save} disabled={!dirty || blocked || saving} className="btn-primary">
          {saving ? "Saving…" : dirty ? "Save version" : "Saved"}
        </button>
      </div>
      {status && (
        <p className={`text-sm ${status.tone === "error" ? "text-red-700" : "text-emerald-800"}`}>{status.text}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Left: the resume version being built */}
        <div className="space-y-4">
          {experiences.map((e) => {
            const rows = bullets.map((b, i) => ({ b, i })).filter(({ b }) => b.experienceId === e.id);
            return (
              <div key={e.id} className="card p-4">
                <p className="text-sm font-medium">
                  {e.title} <span className="font-normal text-stone-500">· {e.org}</span>
                </p>
                {rows.length === 0 && <p className="mt-2 text-xs text-stone-400">Not on this version.</p>}
                <ul className="mt-2 space-y-2">
                  {rows.map(({ b, i }) => {
                    const check = checks[i];
                    return (
                      <li key={i} className={`rounded-md border p-2 ${check.ok ? "border-stone-200" : "border-red-300 bg-red-50/50"}`}>
                        <textarea
                          value={b.text}
                          rows={2}
                          onChange={(ev) => update(bullets.map((x, k) => (k === i ? { ...x, text: ev.target.value } : x)))}
                          className="w-full resize-y bg-transparent text-sm outline-none"
                          aria-label="Bullet text"
                        />
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <GuardBadge ok={check.ok} />
                          <span className="text-stone-500">
                            cites {b.factIds.length} fact{b.factIds.length === 1 ? "" : "s"}
                          </span>
                          <span className="ml-auto flex gap-1">
                            <button onClick={() => move(i, -1)} className="btn-danger text-stone-600" aria-label="Move up">↑</button>
                            <button onClick={() => move(i, 1)} className="btn-danger text-stone-600" aria-label="Move down">↓</button>
                            <button onClick={() => update(bullets.filter((_, k) => k !== i))} className="btn-danger">
                              Remove
                            </button>
                          </span>
                        </div>
                        <Problems check={check} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {experiences.length === 0 && <p className="text-sm text-stone-500">Add experience to your fact bank first.</p>}
        </div>

        {/* Right: sources to add from */}
        <div className="space-y-4">
          {candidates.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-medium">AI drafts</p>
              <ul className="mt-2 space-y-2">
                {candidates.map((c, i) => (
                  <li key={i} className={`rounded-md border p-2 text-sm ${c.guard.ok ? "border-stone-200" : "border-red-200 bg-red-50/60"}`}>
                    <p className={c.guard.ok ? "" : "text-stone-500 line-through decoration-red-400"}>{c.text}</p>
                    <ul className="mt-1 text-xs text-stone-500">
                      {c.factIds.map((id) => (
                        <li key={id} className="truncate">
                          ↳ {factById.get(id)?.did ?? `unknown fact ${id}`}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <GuardBadge ok={c.guard.ok} />
                      {c.guard.ok && (
                        <button onClick={() => add(c)} className="ml-auto btn">
                          Add
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
            <p className="text-sm font-medium">Your facts, as written</p>
            <p className="text-xs text-stone-500">Always safe. Add one, then reword it on the left; the guard keeps checking.</p>
            <ul className="mt-2 space-y-1">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-sm">
                  <span className="min-w-0 flex-1 text-stone-700">{factAsBullet(f).text}</span>
                  <button onClick={() => add(factAsBullet(f))} className="btn shrink-0 px-2 py-0.5 text-xs">
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuardBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800">✓ traceable</span>
  ) : (
    <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800">✕ blocked</span>
  );
}

function Problems({ check }: { check: ReturnType<typeof checkBullet> }) {
  if (check.violations.length === 0 && check.warnings.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-xs">
      {check.violations.map((v, i) => (
        <li key={i} className="text-red-700">
          {describeViolation(v)}
        </li>
      ))}
      {check.warnings.map((w, i) => (
        <li key={`w${i}`} className="text-amber-700">
          {w.type === "too-long" ? `${w.words} words; aim for 30 or fewer` : `Starts with "${w.word}"; lead with what you did`}
        </li>
      ))}
    </ul>
  );
}
