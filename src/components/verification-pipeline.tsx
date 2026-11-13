"use client";

import { useState } from "react";
import { extractNumbers } from "@/lib/core/guard";
import { findTechTerms } from "@/lib/core/vocab";
import { DEMO_DRAFTS, DEMO_FACT, demoCheck } from "@/lib/demo-drafts";
import { IconAlert, IconCheck, IconDownload, IconX } from "./icons";

const FLOWS = [
  { id: "invented", label: "Invented draft", text: DEMO_DRAFTS.inventedShort },
  { id: "faithful", label: "Faithful draft", text: DEMO_DRAFTS.faithfulShort },
] as const;

type FlowId = (typeof FLOWS)[number]["id"];

/** What each check in guard.ts found for a draft. Computed by the real guard. */
function layers(text: string) {
  const { violations } = demoCheck(text);
  const numbers = violations.flatMap((v) => (v.type === "number" ? [v.claim] : []));
  const names = violations.flatMap((v) => (v.type === "tech" || v.type === "term" ? [v.term] : []));
  const citation = violations.some((v) => v.type === "no-citation" || v.type === "unknown-fact");
  const found = (bad: string[], seen: string[]) =>
    bad.length > 0 ? `Not in the fact: ${bad.join(", ")}` : seen.length > 0 ? `Matched ${seen.join(", ")}` : "Nothing to check";
  return [
    {
      name: "Numbers and units",
      rule: "Regex plus unit normalisation (ms, min, %, USD)",
      ok: numbers.length === 0,
      note: found(numbers, extractNumbers(text).map((n) => n.raw)),
    },
    {
      name: "Tool and product names",
      rule: "Tech vocabulary with aliases (PostgreSQL, k8s, C#)",
      ok: names.length === 0,
      note: found(names, findTechTerms(text)),
    },
    {
      name: "Citation",
      rule: "Every cited fact must exist in your Fact Bank",
      ok: !citation,
      note: citation ? "Cited fact not found" : `Fact ${DEMO_FACT.id} exists`,
    },
  ];
}

/** How a draft bullet travels from the LLM, through the code guard, to the PDF. */
export function VerificationPipeline() {
  const [flow, setFlow] = useState<FlowId>("faithful");
  const draft = FLOWS.find((f) => f.id === flow)!;
  const checks = layers(draft.text);
  const ok = checks.every((c) => c.ok);
  const color = ok ? "#047857" : "#b91c1c";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 sm:px-6">
        <h3 className="text-base font-semibold tracking-[-0.015em] text-slate-900">From draft bullet to PDF</h3>
        {/* Container rounded-lg (8px) with p-1 (4px), so the buttons are rounded (4px). */}
        <div role="group" aria-label="Draft to send through the guard" className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {FLOWS.map((f) => {
            const active = flow === f.id;
            const tone = f.id === "faithful" ? "bg-emerald-700" : "bg-red-700";
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFlow(f.id)}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors duration-150 md:min-h-8 ${
                  active ? `${tone} text-white shadow-2xs` : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.id === "faithful" ? <IconCheck size={12} /> : <IconX size={12} />}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-2 p-5 sm:p-6 lg:grid-cols-[1fr_auto_1.35fr_auto_1fr] lg:gap-0">
        {/* 1. Inputs */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Source fact <span className="font-mono text-slate-700">{DEMO_FACT.id}</span>
            </p>
            <p className="mt-1 text-sm leading-[1.6] text-slate-800">
              {DEMO_FACT.did}. {DEMO_FACT.result}.
            </p>
          </div>
          <div className={`rounded-lg border p-3 transition-colors duration-200 ${ok ? "border-emerald-600/30 bg-emerald-50/40" : "border-red-300 bg-red-50/50"}`}>
            <p className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-900" : "text-red-800"}`}>
              {ok ? <IconCheck size={12} /> : <IconAlert size={12} />} Draft bullet from the LLM
            </p>
            <p className="mt-1 text-sm leading-[1.6] text-slate-900">{draft.text}</p>
          </div>
        </div>

        <PipeConnector key={`in-${flow}`} color={color} />

        {/* 2. The guard */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Fabrication guard</p>
            <span className="font-mono text-[11px] text-slate-600">src/lib/core/guard.ts</span>
          </div>
          <ol className="mt-3 space-y-2">
            {checks.map((c, i) => (
              <li
                key={c.name}
                className={`flex items-start gap-2.5 rounded-lg border bg-white p-2.5 transition-colors duration-200 ${
                  c.ok ? "border-slate-200" : "border-red-200 bg-red-50/60"
                }`}
              >
                <span
                  className={`mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded text-[11px] font-semibold tabular-nums ${
                    c.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                  <p className="mt-0.5 text-[11px] text-slate-600">{c.rule}</p>
                  <p className={`mt-1 inline-flex items-start gap-1 text-xs font-medium tabular-nums ${c.ok ? "text-emerald-800" : "text-red-800"}`}>
                    {c.ok ? <IconCheck size={12} className="mt-0.5 shrink-0" /> : <IconX size={12} className="mt-0.5 shrink-0" />}
                    {c.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <PipeConnector key={`out-${flow}`} color={color} blocked={!ok} />

        {/* 3. Outcome */}
        <div
          key={flow}
          role="status"
          className={`relative overflow-hidden rounded-lg border p-4 ${
            ok ? "border-emerald-600/40 bg-white ring-2 ring-emerald-600/10" : "animate-shake border-red-300 bg-red-50/70 ring-2 ring-red-500/10"
          }`}
        >
          {ok && <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />}
          <div className="relative">
            <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${ok ? "text-emerald-900" : "text-red-900"}`}>
              {ok ? <IconDownload size={14} /> : <IconX size={14} />}
              {ok ? "Saved, then exported" : "Blocked"}
            </p>
            <p className={`mt-1 text-xs leading-[1.6] ${ok ? "text-slate-600" : "text-red-800"}`}>
              {ok
                ? "The bullet is saved to this resume version and rendered into a single-column PDF with selectable\u00A0text."
                : "Save stays disabled until the bullet is fixed or removed, so it cannot reach the\u00A0PDF."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipeConnector({ color, blocked = false }: { color: string; blocked?: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center lg:px-1">
      <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="hidden lg:block">
        <line x1="2" y1="12" x2="54" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" className="animate-packet-flow" />
        {blocked ? (
          <g transform="translate(28, 12)">
            <circle r="7" fill="#fef2f2" stroke="#b91c1c" strokeWidth="1.5" />
            <path d="M-2.5 -2.5 L2.5 2.5 M2.5 -2.5 L-2.5 2.5" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M46 7l6 5-6 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
      <svg width="24" height="28" viewBox="0 0 24 28" fill="none" className="lg:hidden">
        <line x1="12" y1="2" x2="12" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round" className="animate-packet-flow" />
      </svg>
    </div>
  );
}
