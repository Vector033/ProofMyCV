// Numbers from eval/README.md (fictional cases). Update both together.
import { InView } from "./in-view";

const RESULTS = [
  {
    num: 547,
    den: 547,
    pct: "100%",
    label: "Invented numbers, tools and citations blocked on the 30 tuning\u00A0cases",
  },
  {
    num: 180,
    den: 186,
    pct: "96.8%",
    label: "Blocked on 10 held-out cases, written after the guard was\u00A0tuned",
  },
  {
    num: 26,
    den: 26,
    pct: "100%",
    label: "Invented claims blocked when a model was told to “add impressive\u00A0metrics”",
  },
] as const;

/** The eval results as plain figures. The numbers are in the HTML; only the bars grow on arrival. */
export function BenchmarkMetrics() {
  return (
    <InView as="dl" className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-3">
      {RESULTS.map((r, i) => (
        <div key={r.label} style={{ "--i": i } as React.CSSProperties} className="flex flex-col-reverse justify-end border-t border-slate-200 pt-5">
          <dt className="mt-3 text-sm leading-[1.6] text-slate-600">{r.label}</dt>
          <dd>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-3xl font-semibold tracking-[-0.025em] text-slate-900 tabular-nums sm:text-4xl">
                {r.num} <span className="text-slate-500">/</span> {r.den}
              </span>
              <span className="text-sm font-semibold text-emerald-800 tabular-nums">{r.pct}</span>
            </p>
            <div aria-hidden="true" className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="bar-fill h-full rounded-full bg-emerald-600" style={{ width: `${(r.num / r.den) * 100}%` }} />
            </div>
          </dd>
        </div>
      ))}
    </InView>
  );
}
