"use client";

import { useState } from "react";

type FlowCase = "blocked" | "verified";

const LAYERS = [
  {
    id: "L1",
    name: "Number & Unit Extractor",
    rule: "Regex + unit normalization (ms, min, %, USD)",
    blockedNote: "Rejected +45% and $40K",
    verifiedNote: "Matched 25 min, 3 min, 2",
  },
  {
    id: "L2",
    name: "Tech Vocabulary Matcher",
    rule: "Symbol-aware aliases (PostgreSQL, k8s, C#)",
    blockedNote: "Rejected Redis (missing)",
    verifiedNote: "Matched PostgreSQL",
  },
  {
    id: "L3",
    name: "Citation Provenance Lock",
    rule: "Every factIds reference exists in Fact Bank",
    blockedNote: "Blocked before DB write",
    verifiedNote: "Anchored to Fact #f1",
  },
] as const;

/**
 * Stripe-style animated architecture diagram showing how FactFit routes a candidate bullet
 * through the 3-layer deterministic AST guard before it can reach the PDF exporter.
 */
export function VerificationPipeline() {
  const [flow, setFlow] = useState<FlowCase>("verified");
  const isVerified = flow === "verified";

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      {/* Header + Case Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/75 px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">
            Deterministic Architecture
          </p>
          <h3 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Fact-to-PDF Verification Pipeline
          </h3>
        </div>

        {/* Toggle: container rounded-lg (8px) p-1 (4px) -> button rounded (4px) */}
        <div
          role="tablist"
          aria-label="Pipeline simulation scenario"
          className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isVerified}
            onClick={() => setFlow("blocked")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              !isVerified ? "bg-red-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Simulate AI Hallucination
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isVerified}
            onClick={() => setFlow("verified")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              isVerified ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Simulate FactFit Verified
          </button>
        </div>
      </div>

      {/* Main SVG + Responsive 3-Stage Pipeline */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto_1.35fr_auto_1fr] lg:gap-0">
          {/* STAGE 1: INPUTS */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase">
                <span>Input Source</span>
                <span className="font-mono text-emerald-800">Fact #f1</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
                PostgreSQL index + 2 slow queries · 25 min to 3 min
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 transition-colors duration-200 ${
                isVerified
                  ? "border-emerald-600/30 bg-emerald-50/40"
                  : "border-red-300 bg-red-50/50"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase">
                <span className={isVerified ? "text-emerald-900" : "text-red-800"}>
                  Candidate Draft
                </span>
                <span className="font-mono text-[10px] text-slate-500">LLM Output</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-800">
                {isVerified
                  ? "Cut report job from 25 min to 3 min via PostgreSQL index and 2 query rewrites."
                  : "Added Redis cache to improve speed by +45% and save $40K/yr."}
              </p>
            </div>
          </div>

          {/* ANIMATED CONNECTOR 1 (Input -> Guard) */}
          <PipeConnector activeColor={isVerified ? "#047857" : "#b91c1c"} />

          {/* STAGE 2: 3-LAYER DETERMINISTIC GUARD SCHEMATIC */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="text-xs font-semibold tracking-wider text-slate-800 uppercase">
                3-Layer Code Guard
              </span>
              <span className="font-mono text-[11px] text-slate-500">src/lib/core/guard.ts</span>
            </div>

            <ol className="mt-3 space-y-2.5">
              {LAYERS.map((layer, idx) => (
                <li
                  key={layer.id}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors duration-200 ${
                    isVerified
                      ? "border-emerald-600/20 bg-white"
                      : idx < 2
                        ? "border-red-200 bg-red-50/60"
                        : "border-slate-200 bg-white/70 opacity-75"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-grid size-5 shrink-0 place-items-center rounded font-mono text-[10px] font-semibold ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-800"
                        : idx < 2
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {layer.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900">{layer.name}</span>
                      <span
                        className={`text-[11px] font-medium whitespace-nowrap tabular-nums ${
                          isVerified ? "text-emerald-800" : "text-red-800"
                        }`}
                      >
                        {isVerified ? layer.verifiedNote : layer.blockedNote}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{layer.rule}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* ANIMATED CONNECTOR 2 (Guard -> Outcome) */}
          <PipeConnector
            activeColor={isVerified ? "#047857" : "#b91c1c"}
            blocked={!isVerified}
          />

          {/* STAGE 3: OUTPUT BRANCH (PDF EXPORT vs QUARANTINE) */}
          <div className="space-y-3">
            {/* Branch A: Verified ATS PDF */}
            <div
              className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-200 ${
                isVerified
                  ? "border-emerald-600/40 bg-white shadow-xs ring-2 ring-emerald-600/10"
                  : "border-slate-200 bg-slate-50/60 opacity-45"
              }`}
            >
              <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900">Single-Column ATS PDF</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap tabular-nums ${
                      isVerified
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/25"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isVerified ? "✓ 0% Hallucination" : "Standby"}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  {isVerified
                    ? "Verified bullet saved to version and rendered into selectable text\u00A0PDF."
                    : "Unreachable while any violation remains\u00A0unresolved."}
                </p>
              </div>
            </div>

            {/* Branch B: Blocked Quarantine */}
            <div
              className={`rounded-xl border p-3.5 transition-all duration-200 ${
                !isVerified
                  ? "animate-shake border-red-300 bg-red-50/75 shadow-xs ring-2 ring-red-500/10"
                  : "border-slate-200 bg-slate-50/60 opacity-45"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-red-900">Guard Quarantine</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap tabular-nums ${
                    !isVerified
                      ? "bg-red-100 text-red-800 ring-1 ring-red-600/20"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {!isVerified ? "✕ Blocked" : "0 Blocked"}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-red-800">
                {!isVerified
                  ? "Save button locked. Candidate cannot accidentally export unverified\u00A0claims."
                  : "All tokens traced back to Fact #f1; zero quarantined\u00A0lines."}
              </p>
            </div>
          </div>
        </div>

        {/* Category 2 #2: Visual Schematic of Known Semantic Boundary */}
        <div className="mt-6 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-800">
              Guard Scope &amp; Known Boundary Visual
            </span>
            <span className="text-[11px] text-slate-500">
              Checks exact numbers &amp; tools, not semantic noun swaps
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-800 tabular-nums">
                120
              </span>
              <span className="text-slate-600">
                Fact: <span className="font-medium text-slate-900">&ldquo;120 members&rdquo;</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 tabular-nums">
                  120
                </span>
                <span className="text-slate-700">
                  Draft: <span className="font-medium text-slate-900">&ldquo;120 bookings&rdquo;</span>
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-amber-800 uppercase">
                User reviews noun
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipeConnector({ activeColor, blocked = false }: { activeColor: string; blocked?: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center justify-center py-1 lg:px-1 lg:py-0">
      {/* Desktop horizontal SVG pipe */}
      <svg width="56" height="24" viewBox="0 0 56 24" fill="none" className="hidden lg:block">
        <line x1="2" y1="12" x2="54" y2="12" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line
          x1="2"
          y1="12"
          x2="54"
          y2="12"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-packet-flow"
        />
        {blocked ? (
          <g transform="translate(28, 12)">
            <circle r="7" fill="#fef2f2" stroke="#b91c1c" strokeWidth="1.5" />
            <path d="M-2.5 -2.5 L2.5 2.5 M2.5 -2.5 L-2.5 2.5" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ) : (
          <path d="M46 7l6 5-6 5" stroke={activeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      {/* Mobile vertical SVG pipe */}
      <svg width="24" height="36" viewBox="0 0 24 36" fill="none" className="lg:hidden">
        <line x1="12" y1="2" x2="12" y2="34" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line
          x1="12"
          y1="2"
          x2="12"
          y2="34"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-packet-flow"
        />
      </svg>
    </div>
  );
}
