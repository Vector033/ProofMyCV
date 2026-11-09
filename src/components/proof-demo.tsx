"use client";

import { useId, useMemo, useState } from "react";
import { checkBullet, describeViolation, extractNumbers } from "@/lib/core/guard";
import { findTechTerms } from "@/lib/core/vocab";
import type { Experience, Fact } from "@/lib/core/types";

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

  return (
    // Outer Container: rounded-2xl (16px), 1px hairline border, subtle Linear precision shadow
    <div className="relative rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_16px_36px_-12px_rgba(15,23,42,0.08)]">
      {/* Top Controller Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-2 items-center justify-center">
            <span className="size-2 rounded-full bg-emerald-600 ring-4 ring-emerald-600/15" />
          </span>
          <span className="text-xs font-semibold tracking-wider text-slate-700 uppercase">
            Interactive Verification Showcase
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">·</span>
          <span className="hidden text-xs text-slate-500 sm:inline">
            Job: Backend Engineer (Fintech)
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
            className={`rounded px-3 py-1 text-xs font-medium transition-all ${
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
            className={`rounded px-3 py-1 text-xs font-medium transition-all ${
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
        /* Split Comparison: Stripe-inspired layout hierarchy + Linear-inspired hairline precision */
        <div className="grid grid-cols-1 divide-y divide-slate-200/80 lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
          {/* ================= LEFT: GENERIC AI RESUME ================= */}
          <div className="flex flex-col p-5 sm:p-6">
            {/* Header: Status & Origin */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Generic AI Resume
              </span>
              <span
                role="status"
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800"
              >
                <CrossIcon />
                <span className="tabular-nums">3 Violations · Blocked</span>
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Generated by ChatGPT / Claude with zero ground-truth constraints
            </p>

            {/* Bullet Text Specimen with Inline Warning Marks */}
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/20 p-4">
              <p className="text-[15px] leading-relaxed text-slate-800">
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
                  className={`cursor-help rounded-sm px-1 py-0.5 font-medium underline decoration-red-400 decoration-wavy underline-offset-4 transition-colors ${
                    hoveredWarning === "cost"
                      ? "bg-red-200/80 text-red-950"
                      : "bg-red-100/70 text-red-900"
                  }`}
                >
                  $40K a year
                </span>
                .
              </p>
            </div>

            {/* Warning Badges: Flagging fabricated claims with strict Anti-AI-Slop precision */}
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold tracking-wider text-red-700 uppercase">
                Deterministic Guard Findings
              </p>

              {/* Requirement 3: Red warning badge on fabricated metric */}
              <div
                onMouseEnter={() => setHoveredWarning("metric")}
                onMouseLeave={() => setHoveredWarning(null)}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                  hoveredWarning === "metric"
                    ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                    : "border-red-200 bg-red-50/70 text-red-900"
                }`}
              >
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                  FLAGGED
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-red-800">
                    Invented +45% metric - UNVERIFIED
                  </span>
                  <p className="mt-0.5 text-[11px] text-red-700">
                    Candidate wrote 25 min → 3 min. Model hallucinated &ldquo;+45%&rdquo; with no source data.
                  </p>
                </div>
              </div>

              {/* Warning on Unverified Tech */}
              <div
                onMouseEnter={() => setHoveredWarning("redis")}
                onMouseLeave={() => setHoveredWarning(null)}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                  hoveredWarning === "redis"
                    ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                    : "border-red-200/80 bg-red-50/50 text-red-900"
                }`}
              >
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                  TOOL
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-red-800">
                    Unverified Technology: Redis
                  </span>
                  <p className="mt-0.5 text-[11px] text-red-700">
                    &ldquo;Redis&rdquo; does not exist in candidate&rsquo;s verified skill inventory.
                  </p>
                </div>
              </div>

              {/* Warning on Unverified Financial Claim */}
              <div
                onMouseEnter={() => setHoveredWarning("cost")}
                onMouseLeave={() => setHoveredWarning(null)}
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                  hoveredWarning === "cost"
                    ? "border-red-300 bg-red-100/70 text-red-950 ring-1 ring-red-400/30"
                    : "border-red-200/80 bg-red-50/50 text-red-900"
                }`}
              >
                <span className="mt-0.5 inline-flex shrink-0 items-center rounded-sm bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">
                  CLAIM
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-red-800">
                    Fabricated Cost Saving: $40K
                  </span>
                  <p className="mt-0.5 text-[11px] text-red-700">
                    Unsubstantiated dollar ROI figure generated to impress reviewers.
                  </p>
                </div>
              </div>
            </div>

            {/* Interview Risk Callout */}
            <div className="mt-auto pt-4">
              <p className="rounded-lg border border-red-200/70 bg-red-50/40 px-3 py-2 text-[11px] text-red-800">
                <span className="font-medium">Interview Defense Risk:</span> When the interviewer asks
                &ldquo;Walk me through your Redis caching architecture,&rdquo; the candidate has no factual answer.
              </p>
            </div>
          </div>

          {/* ================= RIGHT: FACTFIT VERIFIED ================= */}
          <div className="flex flex-col bg-slate-50/40 p-5 sm:p-6">
            {/* Header: Verified Status & Ground Truth */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                FactFit Verified
              </span>
              <span
                role="status"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
              >
                <CheckIcon />
                <span className="tabular-nums">100% Traceable · 0% Hallucination</span>
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Anchored to candidate&rsquo;s verified career fact bank
            </p>

            {/* Bullet Text Specimen with Emerald Citations */}
            <div className="mt-4 rounded-xl border border-emerald-600/25 bg-white p-4 shadow-2xs">
              <p className="text-[15px] leading-relaxed text-slate-900">
                Cut the daily report job from{" "}
                <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                  25 minutes to 3 minutes
                </span>{" "}
                <button
                  type="button"
                  onClick={() => setActiveCitation("f1")}
                  className="inline-flex items-center gap-1 rounded bg-emerald-100/90 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-200"
                  title="Click to view verified source citation"
                >
                  <CitePinIcon /> Fact #1
                </button>{" "}
                by adding a{" "}
                <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                  PostgreSQL
                </span>{" "}
                index and rewriting{" "}
                <span className="rounded-sm bg-emerald-50 px-1 py-0.5 font-medium text-emerald-900 underline decoration-emerald-600/70 underline-offset-4">
                  2 slow queries
                </span>
                .
              </p>
            </div>

            {/* Direct Fact Bank Citation Source Box (Interactive Proof) */}
            <div className="mt-4 flex-1">
              <div
                className={`rounded-xl border p-4 transition-all duration-200 ${
                  activeCitation === "f1"
                    ? "border-emerald-600/35 bg-emerald-50/50 shadow-2xs ring-2 ring-emerald-600/10"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-grid size-5 place-items-center rounded-sm bg-emerald-600 text-[10px] font-bold text-white">
                      ✓
                    </span>
                    <span className="text-xs font-semibold text-emerald-950">
                      Verified Source: Fact #1
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">
                    {EXPERIENCE.org} · {EXPERIENCE.title}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-emerald-600/15 pt-2.5 text-xs text-slate-700">
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 font-medium text-slate-500">Action:</span>
                    <span className="font-medium text-slate-900">{FACT.did}</span>
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
                  <span className="text-slate-500">Deterministic Guard Result:</span>
                  <span className="font-semibold text-emerald-800">
                    Passed (100% tokens matched)
                  </span>
                </div>
              </div>
            </div>

            {/* Interview Defense Reassurance */}
            <div className="mt-auto pt-4">
              <p className="rounded-lg border border-emerald-600/20 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-900">
                <span className="font-semibold text-emerald-950">Interview Defense Ready:</span> When
                the interviewer asks how you cut report time from 25m to 3m, you have the exact queries
                and index details ready.
              </p>
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
                <p className="text-xs text-slate-500">
                  Type any sentence or pick a draft below. The guard verifies every number and tool on keystroke.
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
                className="input font-sans text-[15px] leading-relaxed"
                placeholder="Type your resume bullet here..."
              />
            </div>

            {/* Live Visual Inspection & Guard Results */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Guard Analysis
                </p>
                {sandboxResult.ok ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    <CheckIcon />
                    <span className="tabular-nums">Traceable · Ready for Resume</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    <CrossIcon />
                    <span className="tabular-nums">
                      {sandboxResult.violations.length} Violation
                      {sandboxResult.violations.length === 1 ? "" : "s"} · Blocked
                    </span>
                  </span>
                )}
              </div>

              {/* Highlighted text preview */}
              <div className="mt-3 rounded-lg border border-slate-200/80 bg-white p-3 text-sm leading-relaxed text-slate-900">
                <MarkedText text={sandboxText} bad={sandboxBad} good={sandboxGood} />
              </div>

              {/* Violation Details */}
              {!sandboxResult.ok && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-medium text-red-900">Violations detected:</p>
                  <ul className="space-y-1 text-xs text-red-800">
                    {sandboxResult.violations.map((v, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-red-600" />
                        <span>{describeViolation(v)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings (length, weak verbs) */}
              {sandboxResult.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {sandboxResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-800">
                      ⚠ {w.type === "too-long" ? `${w.words} words; aim for 30 or fewer` : `Weak opening: "${w.word}"; lead with action`}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="fill-none stroke-current stroke-2"
    >
      <path d="M2.5 6.5l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="fill-none stroke-current stroke-2"
    >
      <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
    </svg>
  );
}

function CitePinIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="fill-none stroke-current stroke-2"
    >
      <path d="M6 1v7M3.5 3.5L6 1l2.5 2.5M2 11h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
