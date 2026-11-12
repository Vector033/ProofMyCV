"use client";

import { useId, useMemo, useState } from "react";
import { checkBullet, describeViolation, extractNumbers } from "@/lib/core/guard";
import { findTechTerms } from "@/lib/core/vocab";
import type { Experience, Fact } from "@/lib/core/types";
import { IconAlert, IconCheck, IconLink, IconShield, IconX } from "./icons";

// Fictional verified fact from the demo account.
const EXPERIENCE: Experience = {
  id: "e1",
  kind: "job",
  title: "Software Engineering Intern",
  org: "Lanna Logistics",
};

const FACT: Fact = {
  id: "f1",
  experienceId: "e1",
  did: "Added a PostgreSQL index and rewrote 2 slow reporting queries",
  result: "Daily report job dropped from 25 minutes to 3 minutes",
  tech: ["PostgreSQL", "SQL"],
};

// Preset drafts for the interactive showcase
const PRESETS = {
  unverified_metric: "Architected a PostgreSQL and Redis caching layer that cut reporting latency by +45% and saved $40K a year.",
  unverified_tool: "Integrated Kafka message queue and PostgreSQL to stream reporting metrics in real time.",
  factfit_verified: "Cut daily report job duration from 25 minutes to 3 minutes by adding a PostgreSQL index and rewriting 2 slow queries.",
} as const;

type Mode = "showcase" | "sandbox";

export function ProofDemo() {
  const [mode, setMode] = useState<Mode>("showcase");
  const [sandboxText, setSandboxText] = useState<string>(PRESETS.unverified_metric);
  const [activeCitation, setActiveCitation] = useState<string | null>("f1");
  const [hoveredWarning, setHoveredWarning] = useState<string | null>(null);
  const [tracePulseKey, setTracePulseKey] = useState(0);
  const base = useId();

  // Run the real guard on whatever text is in the sandbox
  const sandboxResult = useMemo(
    () => checkBullet({ experienceId: "e1", text: sandboxText, factIds: ["f1"] }, [FACT], [EXPERIENCE]),
    [sandboxText],
  );

  const sandboxBad = sandboxResult.violations.flatMap((v) =>
    "claim" in v ? [v.claim] : "term" in v ? [v.term] : [],
  );
  const sandboxGood = sandboxResult.ok
    ? [...extractNumbers(sandboxText).map((n) => n.raw), ...findTechTerms(sandboxText)]
    : [];

  const triggerCitation = () => {
    setActiveCitation("f1");
    setTracePulseKey((k) => k + 1);
  };

  return (
    <div className="relative">
      {/* #9 Grainy Gradient Aura: strictly Emerald (--accent) placed solely behind the "FactFit Verified" card */}
      {mode === "showcase" && (
        <>
          <div
            aria-hidden="true"
            className="bg-grainy-emerald pointer-events-none absolute -top-8 -right-8 -bottom-8 left-[46%] z-0 hidden rounded-3xl lg:block"
          />
          <div
            aria-hidden="true"
            className="bg-grainy-emerald pointer-events-none absolute -inset-x-4 -bottom-6 top-[48%] z-0 rounded-3xl lg:hidden"
          />
        </>
      )}

      {/* Outer Container: rounded-2xl (16px), 1px hairline border */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_36px_-12px_rgba(15,23,42,0.08)]">
        {/* Top Controller Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/75 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-2 items-center justify-center">
              <span className="size-2 rounded-full bg-emerald-600 ring-4 ring-emerald-600/15" />
            </span>
            <span className="text-xs font-semibold tracking-[0.04em] text-slate-700 uppercase">
              Interactive Proof Showcase
            </span>
            <span className="hidden text-xs text-slate-300 sm:inline">·</span>
            <span className="hidden font-mono text-[11px] text-slate-600 sm:inline">
              target_role: backend_eng
            </span>
          </div>

          {/* Mode Switcher: Container p-1 (4px) rounded-lg (8px) -> Inner buttons rounded (4px) [8 - 4 = 4] */}
          <div
            role="tablist"
            aria-label="Showcase modes"
            className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "showcase"}
              onClick={() => setMode("showcase")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                mode === "showcase"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Proof Showcase
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sandbox"}
              onClick={() => setMode("sandbox")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-all ${
                mode === "sandbox"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Live Guard Sandbox
            </button>
          </div>
        </div>

        {mode === "showcase" ? (
          /* Split Comparison: Stripe layout hierarchy + Linear hairline precision */
          <div className="grid grid-cols-1 divide-y divide-slate-200/80 lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
            {/* ================= LEFT: GENERIC AI RESUME ================= */}
            <div className="relative flex flex-col p-5 sm:p-6">
              {/* Trust Signal Right Beside Title (Requirement 3: Never rely on color alone) */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-[0.04em] text-slate-800 uppercase">
                  Generic AI Resume
                </span>
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800"
                >
                  <IconX size={13} />
                  <span className="tabular-nums">3 Unverified · Blocked</span>
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600">
                Generated by unconstrained LLM with zero source&nbsp;lock
              </p>

              {/* Resume Preview Document Sheet (#12 Paper Texture + full-height 1px AST scan beam) */}
              <div className="relative mt-4 overflow-hidden rounded-xl border border-red-200/80 bg-[#fffdfc] p-4 shadow-2xs">
                <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
                <div aria-hidden="true" className="animate-scan-sweep pointer-events-none absolute inset-0">
                  <div className="absolute inset-x-0 bottom-0 h-8 border-b border-red-400/35 bg-gradient-to-b from-transparent via-red-500/8 to-red-500/12" />
                </div>
                <p className="relative z-10 text-[15px] leading-[1.6] text-slate-800">
                  Architected a PostgreSQL and{" "}
                  <span
                    onMouseEnter={() => setHoveredWarning("redis")}
                    onMouseLeave={() => setHoveredWarning(null)}
                    className={`cursor-help rounded-sm px-1 py-0.5 font-medium underline decoration-red-400 decoration-wavy underline-offset-4 transition-colors ${
                      hoveredWarning === "redis"
                        ? "bg-red-200/80 text-red-950"
                        : "bg-red-100/70 text-red-900"
                    }`}
                  >
                    Redis caching layer
                  </span>{" "}
                  that cut reporting latency by{" "}
                  <span
                    onMouseEnter={() => setHoveredWarning("metric")}
                    onMouseLeave={() => setHoveredWarning(null)}
                    className={`cursor-help rounded-sm px-1 py-0.5 font-medium underline decoration-red-500 decoration-wavy underline-offset-4 transition-colors ${
                      hoveredWarning === "metric"
                        ? "bg-red-200/90 text-red-950"
                        : "bg-red-100/80 text-red-900"
                    }`}
                  >
                    +45%
                  </span>{" "}
                  and saved{" "}
                  <span
                    onMouseEnter={() => setHoveredWarning("cost")}
                    onMouseLeave={() => setHoveredWarning(null)}
                    className={`cursor-help rounded-sm px-1 py-0.5 font-medium whitespace-nowrap underline decoration-red-400 decoration-wavy underline-offset-4 transition-colors ${
                      hoveredWarning === "cost"
                        ? "bg-red-200/80 text-red-950"
                        : "bg-red-100/70 text-red-900"
                    }`}
                  >
                    $40K a year
                  </span>
                  <span>.</span>
                </p>
              </div>

              {/* Guard Findings: 16px intra-group spacing, icon + text on every alert */}
              <div className="mt-6 space-y-2.5">
                <p className="text-[11px] font-semibold tracking-[0.04em] text-red-800 uppercase">
                  Guard Findings
                </p>

                {/* Red warning badge on fabricated metric */}
                <div
                  onMouseEnter={() => setHoveredWarning("metric")}
                  onMouseLeave={() => setHoveredWarning(null)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                    hoveredWarning === "metric"
                      ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                      : "border-red-200 bg-red-50/70 text-red-900"
                  }`}
                >
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-red-900 uppercase">
                    <IconAlert size={11} /> Flagged
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-red-900">
                      Invented +45% metric - UNVERIFIED
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-800">
                      Candidate wrote 25&nbsp;min&nbsp;→&nbsp;3&nbsp;min. Model hallucinated &ldquo;+45%&rdquo; with no source&nbsp;data.
                    </p>
                  </div>
                </div>

                {/* Warning on Unverified Tech */}
                <div
                  onMouseEnter={() => setHoveredWarning("redis")}
                  onMouseLeave={() => setHoveredWarning(null)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                    hoveredWarning === "redis"
                      ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                      : "border-red-200/80 bg-red-50/50 text-red-900"
                  }`}
                >
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-red-900 uppercase">
                    <IconX size={11} /> Tool
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-red-900">
                      Unverified Technology: Redis
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-800">
                      &ldquo;Redis&rdquo; does not exist in candidate&rsquo;s verified skill&nbsp;inventory.
                    </p>
                  </div>
                </div>

                {/* Warning on Unverified Financial Claim */}
                <div
                  onMouseEnter={() => setHoveredWarning("cost")}
                  onMouseLeave={() => setHoveredWarning(null)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                    hoveredWarning === "cost"
                      ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                      : "border-red-200/80 bg-red-50/50 text-red-900"
                  }`}
                >
                  <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-red-900 uppercase">
                    <IconX size={11} /> Claim
                  </span>
                  <div className="min-w-0">
                    <span className="font-semibold text-red-900">
                      Fabricated Cost Saving: $40K
                    </span>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-red-800">
                      Unsubstantiated dollar ROI figure generated without source&nbsp;evidence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interview Risk Callout */}
              <div className="mt-auto pt-4">
                <p className="flex items-start gap-2 rounded-lg border border-red-200/70 bg-red-50/40 px-3 py-2 text-[11px] leading-relaxed text-red-800">
                  <IconAlert size={14} className="mt-0.5 shrink-0 text-red-700" />
                  <span>
                    <span className="font-semibold">Background &amp; Interview Risk:</span> Interviewers probe Redis caching details the candidate never&nbsp;built.
                  </span>
                </p>
              </div>
            </div>

            {/* ================= RIGHT: FACTFIT VERIFIED ================= */}
            <div className="relative flex flex-col bg-emerald-50/15 p-5 sm:p-6">
              {/* Subtle #9 Grainy Gradient wash within the verified card surface */}
              <div aria-hidden="true" className="bg-grainy-emerald absolute inset-0 z-0 opacity-75" />

              <div className="relative z-10 flex flex-1 flex-col">
                {/* Trust Signal Right Beside Title */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold tracking-[0.04em] text-slate-800 uppercase">
                    FactFit Verified
                  </span>
                  <span
                    role="status"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-800"
                  >
                    <IconShield size={13} />
                    <span className="tabular-nums">4 / 4 claims traced</span>
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-600">
                  Every claim locked to candidate&rsquo;s verified Fact&nbsp;Bank
                </p>

                {/* Resume Preview Document Sheet (#12 Paper Texture + full-height 1px emerald AST scan beam) */}
                <div className="relative mt-4 overflow-hidden rounded-xl border border-emerald-600/25 bg-[#fdfefd] p-4 shadow-2xs">
                  <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
                  <div aria-hidden="true" className="animate-scan-sweep pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-8 border-b border-emerald-600/35 bg-gradient-to-b from-transparent via-emerald-600/8 to-emerald-600/12" />
                  </div>
                  <p className="relative z-10 text-[15px] leading-[1.6] text-slate-900">
                    Cut the daily report job from{" "}
                    <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium whitespace-nowrap text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                      25 minutes to 3 minutes
                    </span>{" "}
                    <button
                      type="button"
                      onClick={triggerCitation}
                      onMouseEnter={triggerCitation}
                      className="press inline-flex items-center gap-1 rounded bg-emerald-100/90 px-1.5 py-0.5 font-mono text-[11px] font-semibold whitespace-nowrap text-emerald-800 transition-colors hover:bg-emerald-200"
                      title="Click to trace citation back to Fact Bank"
                    >
                      <IconLink size={11} /> cite:f1
                    </button>{" "}
                    by adding a{" "}
                    <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                      PostgreSQL
                    </span>{" "}
                    index and rewriting{" "}
                    <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium whitespace-nowrap text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                      2 slow queries
                    </span>
                    <span>.</span>
                  </p>
                </div>

                {/* Spaceship Manual / Stripe Animated SVG Citation Trace Connector centered cleanly */}
                <div aria-hidden="true" className="relative flex h-9 items-center justify-center">
                  <svg
                    key={tracePulseKey}
                    width="24"
                    height="36"
                    viewBox="0 0 24 36"
                    fill="none"
                    className="overflow-visible"
                  >
                    <line x1="12" y1="0" x2="12" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line
                      x1="12"
                      y1="0"
                      x2="12"
                      y2="36"
                      stroke="#047857"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="animate-trace-draw"
                    />
                    <line
                      x1="12"
                      y1="0"
                      x2="12"
                      y2="36"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="animate-packet-flow"
                    />
                    <circle cx="12" cy="3" r="3" fill="#047857" />
                    <circle cx="12" cy="33" r="3" fill="#047857" />
                  </svg>
                  <span className="absolute left-[calc(50%+14px)] rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap text-emerald-800">
                    fact_id: f1
                  </span>
                </div>

                {/* Direct Fact Bank Citation Source Box (cotton stock paper feel) */}
                <div className="flex-1">
                  <div
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                      activeCitation === "f1"
                        ? "border-emerald-600/35 bg-white/95 shadow-2xs ring-2 ring-emerald-600/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="inline-grid size-5 shrink-0 place-items-center rounded-sm bg-emerald-700 text-white">
                            <IconCheck size={12} />
                          </span>
                          <span className="text-xs font-semibold text-emerald-950">
                            Fact&nbsp;#1 Source Record
                          </span>
                        </div>
                        <span className="text-[11px] font-medium whitespace-nowrap text-slate-600">
                          {EXPERIENCE.org} · SWE&nbsp;Intern
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-emerald-600/15 pt-2.5 text-xs text-slate-700">
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 font-medium text-slate-500">Action:</span>
                          <span className="font-medium text-slate-900">
                            Added a PostgreSQL index and rewrote 2&nbsp;slow&nbsp;reporting&nbsp;queries
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-16 shrink-0 font-medium text-slate-500">Metric:</span>
                          <span className="font-semibold text-emerald-900">{FACT.result}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="w-16 shrink-0 font-medium text-slate-500">Tools:</span>
                          <div className="flex flex-wrap gap-1">
                            {FACT.tech.map((t) => (
                              <span
                                key={t}
                                className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700 shadow-2xs"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-emerald-600/15 pt-2.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 tabular-nums">
                          <IconCheck size={12} /> 4 / 4 tokens matched
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">GUARD: PASS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Defense Reassurance */}
                <div className="mt-auto pt-4">
                  <p className="flex items-start gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50/75 px-3 py-2 text-[11px] leading-relaxed text-emerald-900">
                    <IconShield size={14} className="mt-0.5 shrink-0 text-emerald-700" />
                    <span>
                      <span className="font-semibold text-emerald-950">Interview &amp; Audit Safe:</span> Every number and tool maps directly to queries you actually&nbsp;wrote.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= SANDBOX MODE: LIVE GUARD TEST ================= */
          <div className="p-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Test the fabrication guard in real time
                  </p>
                  <p className="text-xs text-slate-600">
                    Type any sentence or pick a preset below. The guard verifies every number and tool on&nbsp;keystroke.
                  </p>
                </div>

                {/* Preset Quick Selectors: Container p-1 rounded-lg -> Inner buttons rounded (4px) */}
                <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setSandboxText(PRESETS.unverified_metric)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      sandboxText === PRESETS.unverified_metric
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Fabricated Metric
                  </button>
                  <button
                    type="button"
                    onClick={() => setSandboxText(PRESETS.unverified_tool)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      sandboxText === PRESETS.unverified_tool
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Unverified Tool
                  </button>
                  <button
                    type="button"
                    onClick={() => setSandboxText(PRESETS.factfit_verified)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                      sandboxText === PRESETS.factfit_verified
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Verified FactFit
                  </button>
                </div>
              </div>

              {/* Editable Textarea Area */}
              <div>
                <label htmlFor={`${base}-sandbox-input`} className="label">
                  Bullet candidate (testing against Fact #1: PostgreSQL, 25m → 3m)
                </label>
                <textarea
                  id={`${base}-sandbox-input`}
                  value={sandboxText}
                  onChange={(e) => setSandboxText(e.target.value)}
                  rows={3}
                  className="input font-sans text-[15px] leading-[1.6]"
                  placeholder="Type your resume bullet here..."
                />
              </div>

              {/* Live Visual Inspection & Guard Results */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.04em] text-slate-600 uppercase">
                    Guard Analysis
                  </p>
                  {sandboxResult.ok ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      <IconCheck size={13} />
                      <span className="tabular-nums">Verified · Ready for Resume</span>
                    </span>
                  ) : (
                    <span
                      key={sandboxResult.violations.length}
                      className="animate-shake inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800"
                    >
                      <IconX size={13} />
                      <span className="tabular-nums">
                        {sandboxResult.violations.length} Violation
                        {sandboxResult.violations.length === 1 ? "" : "s"} · Blocked
                      </span>
                    </span>
                  )}
                </div>

                {/* Highlighted text preview with subtle paper texture */}
                <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-200/80 bg-white p-3 text-sm leading-[1.6] text-slate-900">
                  <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
                  <div className="relative z-10">
                    <MarkedText text={sandboxText} bad={sandboxBad} good={sandboxGood} />
                  </div>
                </div>

                {/* Violation Details */}
                {!sandboxResult.ok && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium text-red-900">Violations detected:</p>
                    <ul className="space-y-1 text-xs text-red-800">
                      {sandboxResult.violations.map((v, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <IconX size={12} className="shrink-0 text-red-700" />
                          <span>{describeViolation(v)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings (length, weak verbs) — color + icon always paired */}
                {sandboxResult.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {sandboxResult.warnings.map((w, i) => (
                      <p key={i} className="flex items-center gap-1.5 text-xs text-amber-800">
                        <IconAlert size={13} className="shrink-0 text-amber-700" />
                        <span>
                          {w.type === "too-long" ? `${w.words} words; aim for 30 or fewer` : `Weak opening: "${w.word}"; lead with action`}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MarkedText({
  text,
  bad,
  good,
}: {
  text: string;
  bad: string[];
  good: string[];
}) {
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
          <mark
            key={i}
            className="rounded-sm bg-red-100 px-1 py-0.5 text-red-950 underline decoration-red-500 decoration-wavy underline-offset-4"
          >
            {p}
          </mark>
        ) : isGood(p) ? (
          <mark
            key={i}
            className="rounded-sm bg-emerald-50 px-1 py-0.5 text-emerald-950 underline decoration-emerald-600/70 underline-offset-4"
          >
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}
