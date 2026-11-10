"use client";

import { useEffect, useRef, useState } from "react";

const RESULTS = [
  {
    num: 547,
    den: 547,
    pct: 100,
    pctLabel: "100%",
    label: "Invented numbers, tools and citations blocked on 30 tuning benchmark\u00A0cases",
  },
  {
    num: 180,
    den: 186,
    pct: 96.8,
    pctLabel: "96.8%",
    label: "Blocked on 10 held-out evaluation cases written after guard logic was\u00A0frozen",
  },
  {
    num: 26,
    den: 26,
    pct: 100,
    pctLabel: "100%",
    label: "Fabricated claims blocked when LLM was instructed to \u2018add impressive\u00A0metrics\u2019",
  },
] as const;

export function BenchmarkMetrics() {
  const ref = useRef<HTMLDListElement>(null);
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
    <dl ref={ref} className="mt-12 grid gap-6 sm:grid-cols-3">
      {RESULTS.map((r, i) => (
        <MetricCard key={r.label} item={r} active={visible} delayMs={i * 110} />
      ))}
    </dl>
  );
}

function MetricCard({
  item,
  active,
  delayMs,
}: {
  item: (typeof RESULTS)[number];
  active: boolean;
  delayMs: number;
}) {
  const shown = useCountUp(item.num, active);

  return (
    <div
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <dt className="sr-only">{item.label}</dt>
        <dd className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
          {shown} <span className="text-slate-400">/</span> {item.den}
        </dd>
        <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 tabular-nums">
          {item.pctLabel}
        </span>
      </div>

      {/* Animated Precision Bar */}
      <div
        aria-hidden="true"
        className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full bg-emerald-600 ${active ? "animate-bar-grow" : "scale-x-0"}`}
          style={{ width: `${item.pct}%`, animationDelay: `${delayMs + 120}ms` }}
        />
      </div>

      <dd className="mt-3 text-sm leading-relaxed text-slate-600">{item.label}</dd>
    </div>
  );
}

function useCountUp(target: number, enabled: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setN(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return enabled ? n : 0;
}
