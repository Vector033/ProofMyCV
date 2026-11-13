import { InView } from "./in-view";
import { ScoreBadge } from "./score-badge";
import { IconCheck, IconMinus } from "./icons";

const STEPS = [
  {
    title: "Record what actually happened",
    body: "Write short facts from your career: what you did, the measured result, and the tools you used. No\u00A0fluff.",
  },
  {
    title: "Match the job's requirements",
    body: "Paste any job posting. FactFit lists the skills it asks for and scores how many your facts already\u00A0back.",
  },
  {
    title: "Export a single-column PDF",
    body: "Every bullet cites its source facts. A number or tool that is not in them is blocked by code before it can be\u00A0saved.",
  },
] as const;

/**
 * The three steps, each with a specimen of what it produces. Rendered visible; InView
 * only adds a staggered entrance when the list scrolls in.
 */
export function Steps() {
  return (
    <InView as="ol" className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <li key={step.title} style={{ "--i": i } as React.CSSProperties} className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <span className="inline-grid size-6 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white tabular-nums">
              {i + 1}
            </span>
            <h3 className="font-semibold tracking-[-0.015em] text-slate-900">{step.title}</h3>
          </div>

          <p className="mt-2 text-sm leading-[1.6] text-slate-600">{step.body}</p>

          {/* The one surface per step: a specimen of what that step produces. */}
          <div aria-hidden className="relative mt-5 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <span className="paper-texture absolute inset-0 rounded-[inherit]" />
            <div className="relative h-full">
              {i === 0 && <FactSpecimen />}
              {i === 1 && <MatchSpecimen />}
              {i === 2 && <PdfSpecimen />}
            </div>
          </div>
        </li>
      ))}
    </InView>
  );
}

function FactSpecimen() {
  return (
    <div className="space-y-2.5 text-sm">
      <p className="font-medium text-slate-900">Rebuilt the parcel tracking page in React and TypeScript</p>
      <p className="border-l-2 border-emerald-600/50 pl-2.5 text-xs text-slate-600">
        Page load went from <span className="font-semibold whitespace-nowrap text-slate-900 tabular-nums">4.1 s</span> to{" "}
        <span className="font-semibold whitespace-nowrap text-emerald-800 tabular-nums">1.3 s</span>
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {["React", "TypeScript"].map((t) => (
          <span key={t} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatchSpecimen() {
  return (
    <div className="flex items-center gap-3.5">
      <ScoreBadge score={88} size="sm" />
      <ul className="min-w-0 flex-1 space-y-2 text-xs">
        <li className="flex items-center justify-between rounded-md border border-emerald-600/20 bg-emerald-50/60 px-2.5 py-1.5 text-emerald-950">
          <span className="font-medium">TypeScript</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
            <IconCheck size={12} /> 1 fact
          </span>
        </li>
        <li className="flex items-center justify-between rounded-md border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-slate-600">
          <span>Kubernetes</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <IconMinus size={11} /> Missing
          </span>
        </li>
      </ul>
    </div>
  );
}

function PdfSpecimen() {
  return (
    <div className="space-y-2.5 text-xs">
      {/* A corner of the exported page */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
        <span className="h-2 w-20 rounded-xs bg-slate-800" />
        <span className="text-[11px] text-slate-500">resume.pdf</span>
      </div>
      <p className="text-[11px] leading-snug text-slate-800">
        • Cut page load from <span className="font-medium whitespace-nowrap tabular-nums">4.1 s to 1.3 s</span> in React and&nbsp;TypeScript.
      </p>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
          <IconCheck size={11} /> Traceable
        </span>
        <span className="text-[11px] text-slate-600 tabular-nums">cites 1 fact</span>
      </div>
    </div>
  );
}
