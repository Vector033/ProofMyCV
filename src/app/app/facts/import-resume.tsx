"use client";

import { useActionState, useState, useTransition } from "react";
import type { DraftExperience } from "@/lib/core/resume";
import type { ExperienceKind } from "@/lib/core/types";
import { importResumeAction, saveImportAction, type ImportState } from "../actions";

const KINDS: [ExperienceKind, string][] = [
  ["job", "Work"],
  ["project", "Project"],
  ["education", "Education"],
  ["activity", "Activity"],
];

type EditFact = { key: number; on: boolean; did: string; result: string; tech: string; unverified: string[] };
type EditExperience = {
  key: number;
  on: boolean;
  kind: ExperienceKind;
  title: string;
  org: string;
  startDate: string;
  endDate: string;
  facts: EditFact[];
};

let nextKey = 0;
const toEditable = (draft: DraftExperience[]): EditExperience[] =>
  draft.map((e) => ({
    key: nextKey++,
    on: true,
    kind: e.kind,
    title: e.title,
    org: e.org,
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    facts: e.facts.map((f) => ({
      key: nextKey++,
      on: true,
      did: f.did,
      result: f.result ?? "",
      tech: f.tech.join(", "),
      unverified: f.unverified ?? [],
    })),
  }));

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function ImportResume({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importResumeAction, {});
  const [closed, setClosed] = useState<string | undefined>();
  const [saved, setSaved] = useState<number | null>(null);
  const reviewing = state.draft && state.draftId !== closed;

  return (
    <section className="card p-5" aria-labelledby="import-heading">
      <h2 id="import-heading" className="font-medium">
        Import from your resume
      </h2>
      {demo ? (
        <p className="body-prose mt-1 text-sm text-slate-600">
          Import is off on the shared demo account, because every visitor sees its data. Sign up to import your own
          resume.
        </p>
      ) : reviewing ? (
        <Review
          key={state.draftId}
          draft={state.draft!}
          parsedBy={state.parsedBy}
          note={state.note}
          onDone={(n) => {
            setClosed(state.draftId);
            setSaved(n);
          }}
        />
      ) : (
        <>
          <p className="body-prose mt-1 text-sm text-slate-600">
            Upload a .docx or .pdf of up to 2 MB. FactFit reads the text and suggests entries for you to check. The file
            is read in memory and not stored, and nothing is saved until you choose to save it.
          </p>
          <form action={action} className="mt-4 flex flex-wrap items-end gap-3" onSubmit={() => setSaved(null)}>
            <label className="block min-w-0 flex-1 basis-64">
              <span className="label">Resume file (.docx or .pdf)</span>
              <input
                type="file"
                name="resume"
                required
                accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="input file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:text-slate-700"
              />
            </label>
            <button className="btn" disabled={pending}>
              {pending ? "Reading…" : "Read file"}
            </button>
          </form>
          <div aria-live="polite">
            {state.error && !pending && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                {state.error}
              </p>
            )}
            {saved !== null && (
              <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Saved {plural(saved, "fact")}. They are in your fact bank below.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Review({
  draft,
  parsedBy,
  note,
  onDone,
}: {
  draft: DraftExperience[];
  parsedBy?: "ai" | "rules";
  note?: string;
  onDone: (saved: number | null) => void;
}) {
  const [items, setItems] = useState(() => toEditable(draft));
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const chosen = items.filter((e) => e.on);
  const factCount = chosen.reduce((n, e) => n + e.facts.filter((f) => f.on).length, 0);

  const setExp = (key: number, patch: Partial<EditExperience>) =>
    setItems((xs) => xs.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const setFact = (expKey: number, key: number, patch: Partial<EditFact> | null) =>
    setItems((xs) =>
      xs.map((e) =>
        e.key !== expKey
          ? e
          : {
              ...e,
              facts: patch === null ? e.facts.filter((f) => f.key !== key) : e.facts.map((f) => (f.key === key ? { ...f, ...patch } : f)),
            },
      ),
    );

  function save(ev: React.FormEvent) {
    ev.preventDefault();
    setError(undefined);
    const entries = chosen.map((e) => ({
      kind: e.kind,
      title: e.title,
      org: e.org,
      location: "",
      startDate: e.startDate,
      endDate: e.endDate,
      facts: e.facts.filter((f) => f.on).map((f) => ({ did: f.did, result: f.result, tech: f.tech })),
    }));
    startSaving(async () => {
      const r = await saveImportAction(entries);
      if (r.error) setError(r.error);
      else onDone(r.saved ?? 0);
    });
  }

  return (
    <form onSubmit={save} className="mt-1">
      <p className="body-prose text-sm text-slate-600">
        {parsedBy === "ai" ? "The AI read your file." : "Simple rules read your file, so check the titles and dates closely."}{" "}
        {note} Untick anything that is wrong, fix the wording, then save. Nothing is in your fact bank yet.
      </p>

      <ol className="mt-5 space-y-4">
        {items.map((e) => (
          <li key={e.key} className={`rounded-lg border p-4 ${e.on ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-900 md:min-h-8">
              <input type="checkbox" checked={e.on} onChange={(x) => setExp(e.key, { on: x.target.checked })} className="size-4 accent-slate-900" />
              <span className="[overflow-wrap:anywhere]">
                Include {e.title.trim() || "this entry"}
                {e.org.trim() && <span className="font-normal text-slate-600"> · {e.org}</span>}
              </span>
            </label>

            <fieldset disabled={!e.on} className="mt-3 space-y-4 disabled:opacity-60">
              <legend className="sr-only">Details of {e.title.trim() || "this entry"}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Type</span>
                  <select value={e.kind} onChange={(x) => setExp(e.key, { kind: x.target.value as ExperienceKind })} className="input">
                    {KINDS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField label="Title" required maxLength={160} value={e.title} onChange={(v) => setExp(e.key, { title: v })} />
                <TextField label="Organisation" maxLength={160} value={e.org} onChange={(v) => setExp(e.key, { org: v })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Start" type="month" value={e.startDate} onChange={(v) => setExp(e.key, { startDate: v })} />
                  <TextField label="End (empty = present)" type="month" value={e.endDate} onChange={(v) => setExp(e.key, { endDate: v })} />
                </div>
              </div>

              {e.facts.length > 0 && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {e.facts.map((f, i) => {
                    const flagged = f.unverified.filter((raw) => `${f.did} ${f.result}`.includes(raw));
                    return (
                      <li key={f.key} className="grid gap-2 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 md:min-h-8">
                            <input
                              type="checkbox"
                              checked={f.on}
                              onChange={(x) => setFact(e.key, f.key, { on: x.target.checked })}
                              className="size-4 accent-slate-900"
                            />
                            Include fact {i + 1}
                          </label>
                          <button type="button" className="btn-danger" onClick={() => setFact(e.key, f.key, null)}>
                            Remove fact {i + 1}
                          </button>
                        </div>
                        <fieldset disabled={!f.on} className="grid gap-3 disabled:opacity-60">
                          <legend className="sr-only">Fact {i + 1}</legend>
                          <label className="block">
                            <span className="label">What you did</span>
                            <textarea
                              required
                              minLength={3}
                              maxLength={400}
                              rows={2}
                              value={f.did}
                              onChange={(x) => setFact(e.key, f.key, { did: x.target.value })}
                              className="input"
                            />
                          </label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <TextField label="Result" maxLength={300} value={f.result} onChange={(v) => setFact(e.key, f.key, { result: v })} />
                            <TextField label="Technologies (comma separated)" maxLength={300} value={f.tech} onChange={(v) => setFact(e.key, f.key, { tech: v })} />
                          </div>
                          {flagged.length > 0 && (
                            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                              Not found in your file: {flagged.join(", ")}. Check it before saving.
                            </p>
                          )}
                        </fieldset>
                      </li>
                    );
                  })}
                </ul>
              )}
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-3" aria-live="polite">
        <button className="btn-primary" disabled={saving || chosen.length === 0}>
          {saving ? "Saving…" : `Save ${plural(chosen.length, "entry", "entries")} and ${plural(factCount, "fact")}`}
        </button>
        <button type="button" className="btn" disabled={saving} onClick={() => onDone(null)}>
          Discard
        </button>
        {error && (
          <p role="alert" className="w-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  onChange,
  ...props
}: { label: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...props} onChange={(x) => onChange(x.target.value)} />
    </label>
  );
}
