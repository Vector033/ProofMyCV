"use client";

import { useEffect, useRef, useState } from "react";
import { ScoreBadge } from "./score-badge";
import { IconCheck, IconMinus } from "./icons";

const DEMO_TECH = ["React", "TypeScript"];

const STEPS = [
  {
    title: "Record what actually happened",
    body: "Write short, bullet-level facts from your career: what you did, the measured result, and the tools you used. No\u00A0fluff.",
  },
  {
    title: "Extract & match job requirements",
    body: "Paste any job posting. FactFit extracts required skills and calculates your exact coverage score against your verified\u00A0facts.",
  },
  {
    title: "Export verified, ATS-ready PDF",
    body: "Every bullet cites its source facts. Any invented metric or unverified tool is blocked by code before the PDF is\u00A0generated.",
  },
] as const;

export function AnimatedSteps() {
  const ref = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={ref} className="mt-8 grid gap-8 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        // Outer card: rounded-2xl (16px), p-5 (20px) -> inner specimen card rounded-xl (12px)
        <li
          key={step.title}
          style={{ transitionDelay: `${i * 90}ms` }}
          className={`flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 shadow-2xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="inline-grid size-6 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white tabular-nums">
              {i + 1}
            </span>
            <h3 className="font-semibold tracking-[-0.015em] text-slate-900">{step.title}</h3>
          </div>

          <p className="mt-2 text-sm leading-[1.6] text-slate-600">{step.body}</p>

          {/* Specimen Box: rounded-xl (12px) with #12 Paper Texture + #5 Speckled Graphite */}
          <div
            aria-hidden
            className="relative mt-6 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs"
          >
            <span className="paper-texture absolute inset-0 rounded-[inherit]" />
            <div className="relative z-10 h-full">
              {i === 0 && <StepOneSpecimen active={visible} />}
              {i === 1 && <StepTwoSpecimen active={visible} />}
              {i === 2 && <StepThreeSpecimen active={visible} />}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepOneSpecimen({ active }: { active: boolean }) {
  return (
    <div className="space-y-2.5 text-sm">
      <p
        className={`font-medium text-slate-900 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
        }`}
      >
        Rebuilt the parcel tracking page in React and TypeScript
      </p>
      <p
        style={{ transitionDelay: "180ms" }}
        className={`border-l-2 border-emerald-600/50 pl-2.5 text-xs text-slate-600 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
        }`}
      >
        Page load went from <span className="font-semibold whitespace-nowrap text-slate-900 tabular-nums">4.1 s</span> to{" "}
        <span className="font-semibold whitespace-nowrap text-emerald-800 tabular-nums">1.3 s</span>
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {DEMO_TECH.map((t, idx) => (
          <span
            key={t}
            style={{ transitionDelay: `${300 + idx * 100}ms` }}
            className={`rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700 shadow-2xs transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              active ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepTwoSpecimen({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="shrink-0">
        {active ? <ScoreBadge score={88} size="sm" animate /> : <ScoreBadge score={0} size="sm" />}
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-xs">
        <li
          style={{ transitionDelay: "200ms" }}
          className={`flex items-center justify-between rounded-lg border border-emerald-600/20 bg-emerald-50/60 px-2.5 py-1.5 text-emerald-950 transition-all duration-400 ${
            active ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
          }`}
        >
          <span className="font-medium">TypeScript</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <IconCheck size={12} /> Fact #1
          </span>
        </li>
        <li
          style={{ transitionDelay: "340ms" }}
          className={`flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-slate-600 transition-all duration-400 ${
            active ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
          }`}
        >
          <span>Kubernetes</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <IconMinus size={11} /> Missing
          </span>
        </li>
      </ul>
    </div>
  );
}

function StepThreeSpecimen({ active }: { active: boolean }) {
  return (
    <div className="space-y-2.5 text-xs">
      {/* Mini Single-Column A4 PDF Sheet */}
      <div className="rounded-lg border border-slate-200/90 bg-slate-50/60 p-2.5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
          <span className="h-2 w-20 rounded-xs bg-slate-800" />
          <span className="font-mono text-[9px] text-slate-500">ATS_RESUME.PDF</span>
        </div>
        <div className="mt-2 space-y-1.5">
          <div
            style={{ transitionDelay: "180ms" }}
            className={`text-[11px] leading-snug text-slate-800 transition-opacity duration-500 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            • Cut page load from <span className="font-medium whitespace-nowrap tabular-nums">4.1 s to 1.3 s</span> in React &amp;&nbsp;TypeScript.
          </div>
          <div
            style={{ transitionDelay: "320ms" }}
            className={`h-1.5 w-4/5 rounded-xs bg-slate-200 transition-all duration-500 ${
              active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
            } origin-left`}
          />
        </div>
      </div>

      <div
        style={{ transitionDelay: "460ms" }}
        className={`flex items-center justify-between transition-all duration-400 ${
          active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
          <IconCheck size={11} /> 0% Hallucination
        </span>
        <span className="text-[11px] text-slate-600 tabular-nums">Cites 1 verified fact</span>
      </div>
    </div>
  );
}
