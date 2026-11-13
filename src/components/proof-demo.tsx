"use client";

import { useId, useState } from "react";
import { describeViolation, describeWarning } from "@/lib/core/guard";
import {
  DEMO_DRAFTS,
  DEMO_EXPERIENCE,
  DEMO_FACT,
  demoCheck,
  demoClaims,
  violationTerms,
} from "@/lib/demo-drafts";
import { IconAlert, IconCheck, IconLink, IconShield, IconX } from "./icons";

type Mode = "compare" | "sandbox";

const MODES: { id: Mode; label: string }[] = [
  { id: "compare", label: "Compare drafts" },
  { id: "sandbox", label: "Try the guard" },
];

const PRESETS = [
  { label: "Invented metric", text: DEMO_DRAFTS.invented },
  { label: "Invented tool", text: DEMO_DRAFTS.inventedTool },
  { label: "Faithful", text: DEMO_DRAFTS.faithful },
] as const;

// Both verdicts come from the real guard, not from hand-written labels.
const invented = demoCheck(DEMO_DRAFTS.invented);
const inventedTerms = violationTerms(DEMO_DRAFTS.invented);
const faithfulClaims = demoClaims(DEMO_DRAFTS.faithful);

const segment = (active: boolean) =>
  `min-h-11 rounded px-3 text-xs font-medium transition-colors duration-150 md:min-h-8 ${
    active ? "bg-slate-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
  }`;

export function ProofDemo() {
  const [mode, setMode] = useState<Mode>("compare");
  const [sandboxText, setSandboxText] = useState<string>(DEMO_DRAFTS.invented);
  const [hovered, setHovered] = useState<string | null>(null);
  const [traceKey, setTraceKey] = useState(0);
  const base = useId();

  const result = demoCheck(sandboxText);
  const bad = violationTerms(sandboxText);
  const good = result.ok ? demoClaims(sandboxText) : [];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_36px_-12px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/75 px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold text-slate-900">One fact, two drafts</p>
        {/* Container rounded-lg (8px) with p-1 (4px), so the buttons are rounded (4px). */}
        <div role="group" aria-label="Demo view" className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
          {MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => setMode(m.id)} className={segment(mode === m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "compare" ? (
        <div className="grid grid-cols-1 divide-y divide-slate-200/80 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Left: a draft written with nothing to check it against. */}
          <div className="flex flex-col p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Unchecked AI draft</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 tabular-nums">
                <IconX size={13} />
                {invented.violations.length} not in your facts
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Written with no facts to check&nbsp;against.</p>

            <Sheet tone="bad">
              <MarkedText text={DEMO_DRAFTS.invented} bad={inventedTerms} good={[]} hovered={hovered} onHover={setHovered} />
            </Sheet>

            <ul className="mt-4 space-y-1 text-sm text-red-900">
              {invented.violations.map((v, i) => (
                <li
                  key={i}
                  onMouseEnter={() => setHovered(inventedTerms[i])}
                  onMouseLeave={() => setHovered(null)}
                  className={`flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 ${
                    hovered === inventedTerms[i] ? "bg-red-50" : ""
                  }`}
                >
                  <IconX size={14} className="mt-1 shrink-0 text-red-700" />
                  <span>{describeViolation(v)}</span>
                </li>
              ))}
            </ul>

            <p className="mt-auto flex items-start gap-2 pt-5 text-xs leading-relaxed text-slate-600">
              <IconAlert size={14} className="mt-0.5 shrink-0 text-red-700" />
              <span>In an interview you would have to explain a Redis cache you never&nbsp;built.</span>
            </p>
          </div>

          {/* Right: the same fact, written faithfully. */}
          <div className="flex flex-col bg-emerald-50/30 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Checked by FactFit</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-800 tabular-nums">
                <IconShield size={13} />
                {faithfulClaims.length} of {faithfulClaims.length} claims traced
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Every number and tool comes from the fact&nbsp;below.</p>

            <Sheet tone="good">
              <MarkedText text={DEMO_DRAFTS.faithful} bad={[]} good={faithfulClaims} />
            </Sheet>

            {/* The citation: press to redraw the line from the bullet to its fact. */}
            <button
              type="button"
              onClick={() => setTraceKey((k) => k + 1)}
              className="press mx-auto flex min-h-11 items-center gap-2 rounded-md px-2 text-xs font-medium text-emerald-800 hover:text-emerald-950"
            >
              <svg key={traceKey} width="12" height="36" viewBox="0 0 12 36" fill="none" aria-hidden="true">
                <line x1="6" y1="0" x2="6" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="6" y1="0" x2="6" y2="36" stroke="#047857" strokeWidth="2" strokeLinecap="round" className="animate-trace-draw" />
                <circle cx="6" cy="3" r="3" fill="#047857" />
                <circle cx="6" cy="33" r="3" fill="#047857" />
              </svg>
              <IconLink size={12} />
              <span>
                cites fact <span className="font-mono">{DEMO_FACT.id}</span>
              </span>
            </button>

            <div className="relative overflow-hidden rounded-lg border border-emerald-600/30 bg-white p-4 shadow-2xs">
              <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
              <div className="relative">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-xs font-semibold text-slate-900">
                    Fact <span className="font-mono">{DEMO_FACT.id}</span> in your Fact&nbsp;Bank
                  </p>
                  <p className="text-xs text-slate-600">
                    {DEMO_EXPERIENCE.title} · {DEMO_EXPERIENCE.org}
                  </p>
                </div>
                <dl className="mt-3 grid grid-cols-[4rem_1fr] gap-x-2 gap-y-1.5 border-t border-slate-200/80 pt-3 text-xs">
                  <dt className="text-slate-500">Did</dt>
                  <dd className="text-slate-900">{DEMO_FACT.did}</dd>
                  <dt className="text-slate-500">Result</dt>
                  <dd className="font-medium text-slate-900">{DEMO_FACT.result}</dd>
                  <dt className="text-slate-500">Tools</dt>
                  <dd className="flex flex-wrap gap-1">
                    {DEMO_FACT.tech.map((t) => (
                      <span key={t} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
                        {t}
                      </span>
                    ))}
                  </dd>
                </dl>
              </div>
            </div>

            <p className="mt-auto flex items-start gap-2 pt-5 text-xs leading-relaxed text-slate-600">
              <IconShield size={14} className="mt-0.5 shrink-0 text-emerald-700" />
              <span>Every number and tool is something you wrote down, so you can explain each&nbsp;one.</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Edit the draft and watch the guard</h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Checked against fact <span className="font-mono">{DEMO_FACT.id}</span>: &ldquo;{DEMO_FACT.did}. {DEMO_FACT.result}.&rdquo;
              </p>
            </div>
            <div role="group" aria-label="Example drafts" className="flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={sandboxText === p.text}
                  onClick={() => setSandboxText(p.text)}
                  className={segment(sandboxText === p.text)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`${base}-draft`} className="label">
              Draft bullet
            </label>
            <textarea
              id={`${base}-draft`}
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              rows={3}
              className="input text-[15px] leading-[1.6]"
              placeholder="Type a resume bullet"
            />
          </div>

          <div aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-700">What the guard sees</p>
              {result.ok ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  <IconCheck size={13} />
                  Traceable
                </span>
              ) : (
                <span
                  key={result.violations.length}
                  className="animate-shake inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 tabular-nums"
                >
                  <IconX size={13} />
                  Blocked: {result.violations.length} not in the fact
                </span>
              )}
            </div>

            <div className="relative mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 text-sm leading-[1.6] text-slate-900">
              <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
              <div className="relative">
                <MarkedText text={sandboxText} bad={bad} good={good} />
              </div>
            </div>

            {(result.violations.length > 0 || result.warnings.length > 0) && (
              <ul className="mt-3 space-y-1.5 text-xs">
                {result.violations.map((v, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-red-800">
                    <IconX size={13} className="mt-0.5 shrink-0 text-red-700" />
                    <span>{describeViolation(v)}</span>
                  </li>
                ))}
                {result.warnings.map((w, i) => (
                  <li key={`w${i}`} className="flex items-start gap-1.5 text-amber-800">
                    <IconAlert size={13} className="mt-0.5 shrink-0 text-amber-700" />
                    <span>
                      {describeWarning(w)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** A resume-paper sheet. The guard's scan line passes over it once when it appears. */
function Sheet({ tone, children }: { tone: "good" | "bad"; children: React.ReactNode }) {
  const good = tone === "good";
  return (
    <div className={`relative mt-4 overflow-hidden rounded-lg border bg-white p-4 shadow-2xs ${good ? "border-emerald-600/30" : "border-red-200"}`}>
      <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
      <div aria-hidden="true" className="animate-scan-sweep pointer-events-none absolute inset-0 opacity-0">
        <div className={`absolute inset-x-0 bottom-0 h-8 border-b ${good ? "border-emerald-600/40 bg-emerald-600/8" : "border-red-400/40 bg-red-500/8"}`} />
      </div>
      <p className="relative text-[15px] leading-[1.7] text-slate-900">{children}</p>
    </div>
  );
}

function MarkedText({
  text,
  bad,
  good,
  hovered,
  onHover,
}: {
  text: string;
  bad: string[];
  good: string[];
  hovered?: string | null;
  onHover?: (term: string | null) => void;
}) {
  const terms = [...new Set([...bad, ...good])].filter(Boolean).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return <>{text}</>;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${esc.join("|")})`, "gi"));
  const find = (list: string[], p: string) => list.find((t) => t.toLowerCase() === p.toLowerCase());

  return (
    <>
      {parts.map((p, i) => {
        const badTerm = find(bad, p);
        if (badTerm) {
          return (
            <mark
              key={i}
              onMouseEnter={onHover && (() => onHover(badTerm))}
              onMouseLeave={onHover && (() => onHover(null))}
              className={`rounded-sm px-1 py-0.5 text-red-950 underline decoration-red-500 decoration-wavy underline-offset-4 transition-colors duration-150 ${
                hovered === badTerm ? "bg-red-200" : "bg-red-100"
              }`}
            >
              {p}
            </mark>
          );
        }
        if (find(good, p)) {
          return (
            <mark key={i} className="rounded-sm bg-emerald-50 px-1 py-0.5 text-emerald-950 underline decoration-emerald-600/70 underline-offset-4">
              {p}
            </mark>
          );
        }
        return p;
      })}
    </>
  );
}
