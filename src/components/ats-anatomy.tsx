import { IconCheck, IconX } from "./icons";
import { InView } from "./in-view";

/**
 * Two annotated sketches: the reading order a parser can take through a multi-column
 * template, and the order through FactFit's single-column PDF. The pictures carry no
 * text; the captions under them do, so they stay readable on a phone.
 */
export function AtsAnatomy() {
  return (
    <InView className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Figure
        title="Multi-column template"
        tone="bad"
        notes={["A parser can jump between the sidebar and the main column.", "Skill bars and icons carry no text to read."]}
      >
        <svg viewBox="0 0 352 232" className="w-full" role="img" aria-label="A two-column resume. The reading path zigzags between the sidebar and the main column.">
          <rect x="16" y="16" width="320" height="200" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* Sidebar */}
          <rect x="28" y="28" width="94" height="176" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeDasharray="3 3" />
          <circle cx="75" cy="52" r="13" fill="#e2e8f0" />
          <rect x="40" y="76" width="70" height="6" rx="2" fill="#cbd5e1" />
          <rect x="40" y="90" width="52" height="5" rx="2" fill="#e2e8f0" />
          <rect x="40" y="114" width="70" height="6" rx="3" fill="#e2e8f0" />
          <rect x="40" y="114" width="54" height="6" rx="3" fill="#94a3b8" />
          <rect x="40" y="128" width="70" height="6" rx="3" fill="#e2e8f0" />
          <rect x="40" y="128" width="46" height="6" rx="3" fill="#94a3b8" />
          {/* Main column */}
          <rect x="136" y="30" width="186" height="14" rx="3" fill="#1e293b" />
          <rect x="136" y="52" width="134" height="6" rx="2" fill="#94a3b8" />
          <rect x="136" y="76" width="182" height="7" rx="2" fill="#cbd5e1" />
          <rect x="136" y="90" width="164" height="7" rx="2" fill="#cbd5e1" />
          <rect x="136" y="104" width="174" height="7" rx="2" fill="#cbd5e1" />
          <rect x="136" y="128" width="182" height="7" rx="2" fill="#cbd5e1" />
          <rect x="136" y="142" width="146" height="7" rx="2" fill="#cbd5e1" />
          {/* Reading path */}
          <path
            d="M 40 79 L 136 37 L 40 117 L 136 79 L 40 131 L 136 131"
            fill="none"
            stroke="#b91c1c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 6"
          />
          <circle cx="40" cy="79" r="3" fill="#b91c1c" />
        </svg>
      </Figure>

      <Figure title="FactFit single-column PDF" tone="good" notes={["One column, read top to bottom.", "Selectable text, under 2.5 MB."]}>
        <svg viewBox="0 0 352 232" className="w-full" role="img" aria-label="A single-column resume. The reading path runs straight from top to bottom.">
          <rect x="16" y="16" width="320" height="200" rx="8" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1.5" />
          <rect x="48" y="30" width="136" height="12" rx="3" fill="#0f172a" />
          <rect x="48" y="48" width="204" height="5" rx="2" fill="#64748b" />
          <line x1="48" y1="62" x2="316" y2="62" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="48" y="74" width="74" height="6" rx="2" fill="#475569" />
          <rect x="48" y="88" width="252" height="7" rx="2" fill="#cbd5e1" />
          <rect x="48" y="102" width="234" height="7" rx="2" fill="#cbd5e1" />
          <rect x="48" y="116" width="246" height="7" rx="2" fill="#cbd5e1" />
          <rect x="48" y="140" width="54" height="6" rx="2" fill="#475569" />
          <rect x="48" y="154" width="258" height="7" rx="2" fill="#cbd5e1" />
          <rect x="48" y="168" width="210" height="7" rx="2" fill="#cbd5e1" />
          <rect x="48" y="192" width="64" height="6" rx="2" fill="#475569" />
          {/* Reading path */}
          <path d="M 32 32 L 32 196" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="32" r="3" fill="#047857" />
          <path d="M 27 190 L 32 198 L 37 190" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Figure>
    </InView>
  );
}

function Figure({
  title,
  tone,
  notes,
  children,
}: {
  title: string;
  tone: "good" | "bad";
  notes: string[];
  children: React.ReactNode;
}) {
  const good = tone === "good";
  const Icon = good ? IconCheck : IconX;
  return (
    <figure style={{ "--i": good ? 1 : 0 } as React.CSSProperties}>
      <div className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-2xs ${good ? "border-emerald-600/25" : "border-slate-200/90"}`}>
        <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
        <div className="relative">{children}</div>
      </div>
      <figcaption className="mt-4">
        <p className="font-semibold tracking-[-0.015em] text-slate-900">{title}</p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
          {notes.map((n) => (
            <li key={n} className="flex items-start gap-2">
              <Icon size={14} className={`mt-1 shrink-0 ${good ? "text-emerald-700" : "text-red-700"}`} />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
