"use client";

import { useId, useMemo, useState } from "react";
import { checkBullet, describeViolation, extractNumbers } from "@/lib/core/guard";
import { findTechTerms } from "@/lib/core/vocab";
import type { Experience, Fact } from "@/lib/core/types";

// A fictional fact from the demo account. The guard below is the real one.
const EXPERIENCE: Experience = { id: "e1", kind: "job", title: "Software Engineering Intern", org: "Lanna Logistics" };
const FACT: Fact = {
  id: "f1",
  experienceId: "e1",
  did: "Added a PostgreSQL index and rewrote 2 slow reporting queries",
  result: "Daily report job dropped from 25 minutes to 3 minutes",
  tech: ["PostgreSQL", "SQL"],
};

const DRAFTS = {
  ai: "Architected a PostgreSQL and Redis caching layer that cut reporting time by 90% and saved $40K a year.",
  factfit: "Cut the daily report job from 25 minutes to 3 minutes by adding a PostgreSQL index and rewriting 2 slow queries.",
} as const;

type Tab = "ai" | "factfit" | "own";
const TABS: { id: Tab; label: string }[] = [
  { id: "ai", label: "Typical AI" },
  { id: "factfit", label: "FactFit" },
  { id: "own", label: "Try your own" },
];

const run = (text: string) => checkBullet({ experienceId: "e1", text, factIds: ["f1"] }, [FACT], [EXPERIENCE]);

export function ProofDemo() {
  const [tab, setTab] = useState<Tab>("ai");
  const [own, setOwn] = useState<string>(DRAFTS.ai);
  const base = useId();
  const text = tab === "own" ? own : DRAFTS[tab];
  const result = useMemo(() => run(text), [text]);

  // Arrow keys move between tabs (WAI-ARIA tabs pattern); Tab goes into the panel.
  const onTabKey = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const i = (TABS.findIndex((t) => t.id === tab) + step + TABS.length) % TABS.length;
    setTab(TABS[i].id);
    document.getElementById(`${base}-${TABS[i].id}`)?.focus();
  };

  // Red marks for what the guard rejected; green marks for numbers and tools it traced.
  const bad = result.violations.flatMap((v) => ("claim" in v ? [v.claim] : "term" in v ? [v.term] : []));
  const good = result.ok ? [...extractNumbers(text).map((n) => n.raw), ...findTechTerms(text)] : [];

  return (
    <div className="card overflow-hidden shadow-[0_1px_2px_rgb(28_25_23/0.04),0_12px_32px_-12px_rgb(28_25_23/0.12)]">
      <div className="border-b border-stone-200/80 bg-stone-50/60 px-5 py-4">
        <p className="eyebrow">Fact you wrote · {EXPERIENCE.org}</p>
        <p className="mt-2 text-sm text-stone-800">
          {FACT.did}. <span className="text-stone-600">{FACT.result}.</span>
        </p>
        <p className="mt-2 flex flex-wrap gap-1">
          {FACT.tech.map((t) => (
            <span key={t} className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-stone-600 ring-1 ring-stone-200">
              {t}
            </span>
          ))}
        </p>
      </div>

      <div role="tablist" aria-label="Compare drafts" onKeyDown={onTabKey} className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-stone-200/80 px-3 pt-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`${base}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            aria-controls={`${base}-panel`}
            onClick={() => setTab(t.id)}
            className={`min-h-10 shrink-0 border-b-2 px-3 text-sm transition-colors duration-150 ${
              tab === t.id ? "border-emerald-700 font-medium text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${tab}`} className="min-h-48 space-y-4 px-5 py-5">
        {tab === "own" ? (
          <label className="block">
            <span className="label">Edit the bullet. The guard re-checks every keystroke.</span>
            <textarea value={own} onChange={(e) => setOwn(e.target.value)} rows={3} className="input text-[15px] leading-relaxed" />
          </label>
        ) : (
          <p className="text-[15px] leading-relaxed text-stone-900">
            <Marked text={text} bad={bad} good={good} />
          </p>
        )}

        <div>
          {result.ok ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span role="status" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 ring-1 ring-emerald-600/20">
                <Check /> Traceable
              </span>
              <span className="text-stone-600">Every number and tool appears in the fact it cites.</span>
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <span role="status" className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 font-medium text-red-800 ring-1 ring-red-600/20">
                <Cross /> Blocked, cannot be saved
              </span>
              <ul className="space-y-1 text-red-800">
                {result.violations.map((v, i) => (
                  <li key={i}>{describeViolation(v)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Marked({ text, bad, good }: { text: string; bad: string[]; good: string[] }) {
  const terms = [...new Set([...bad, ...good])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return <>{text}</>;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${esc.join("|")})`, "gi"));
  const isBad = (p: string) => bad.some((b) => b.toLowerCase() === p.toLowerCase());
  const isGood = (p: string) => good.some((g) => g.toLowerCase() === p.toLowerCase());
  return (
    <>
      {parts.map((p, i) =>
        isBad(p) ? (
          <mark key={i} className="rounded-sm bg-red-100 px-0.5 text-red-900 underline decoration-red-500 decoration-wavy underline-offset-4">
            {p}
          </mark>
        ) : isGood(p) ? (
          <mark key={i} className="rounded-sm bg-emerald-50 px-0.5 text-emerald-900 underline decoration-emerald-600/60 underline-offset-4">
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="fill-none stroke-current stroke-2">
    <path d="M2.5 6.5l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Cross = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="fill-none stroke-current stroke-2">
    <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
  </svg>
);
