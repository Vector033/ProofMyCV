"use client";

import { useEffect, useState } from "react";

const SIZES = {
  sm: { box: 44, stroke: 4, text: "text-xs" },
  lg: { box: 88, stroke: 6, text: "text-xl" },
} as const;

function tone(score: number) {
  if (score >= 75) return { ring: "stroke-emerald-600", track: "stroke-emerald-100", label: "strong fit" };
  if (score >= 45) return { ring: "stroke-amber-500", track: "stroke-amber-100", label: "partial fit" };
  return { ring: "stroke-red-500", track: "stroke-red-100", label: "weak fit" };
}

/**
 * Fit score as a ring. `animate` draws the ring and counts the number up once,
 * for the big badge on an application page; list rows stay static because they are
 * seen many times a day.
 */
export function ScoreBadge({ score, size = "sm", animate = false }: { score: number; size?: "sm" | "lg"; animate?: boolean }) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const { box, stroke, text } = SIZES[size];
  const r = (box - stroke) / 2;
  const length = 2 * Math.PI * r;
  const t = tone(value);
  const shown = useCountUp(value, animate);

  return (
    <span
      role="img"
      aria-label={`Fit score ${value}%, ${t.label}`}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: box, height: box }}
    >
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90" aria-hidden>
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" strokeWidth={stroke} className={t.track} />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`${t.ring} ${animate ? "ring-animate" : ""}`}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - value / 100)}
          style={{ "--ring-length": length } as React.CSSProperties}
        />
      </svg>
      <span aria-hidden className={`absolute font-semibold text-slate-900 tabular-nums ${text}`}>
        {shown}
        <span className="text-[0.7em] font-medium text-slate-500">%</span>
      </span>
    </span>
  );
}

// Same 900ms strong ease-out as the ring, so number and stroke land together.
function useCountUp(target: number, enabled: boolean) {
  const [n, setN] = useState(enabled ? 0 : target);
  useEffect(() => {
    let frame = 0;
    if (!enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setN(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 900);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled]);
  return n;
}
