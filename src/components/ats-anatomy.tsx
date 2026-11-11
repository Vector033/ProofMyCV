"use client";

import { IconCheck, IconX } from "./icons";

/**
 * Trend #5 ("Spaceship Instruction Manual") exploded SVG schematic comparing how legacy
 * ATS parsers misread multi-column AI templates vs FactFit's single-column cotton PDF layout.
 */
export function AtsAnatomy() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: Multi-column AI Template (Broken Parser Path) */}
      <div className="relative overflow-hidden rounded-2xl border border-red-200/80 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold tracking-[0.04em] text-red-700 uppercase">
              Multi-Column AI Template
            </span>
            <p className="mt-0.5 text-xs text-slate-600">
              Sidebars, tables, and icons scramble ATS line-by-line text&nbsp;extraction
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-red-800 tabular-nums">
            <IconX size={12} /> Parser Collisions
          </span>
        </div>

        {/* Exploded Schematic */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
          <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
          <svg
            viewBox="0 0 460 232"
            className="relative z-10 w-full"
            role="img"
            aria-label="Diagram showing a multi-column resume causing erratic ATS parser line jumps"
          >
            {/* Outer A4 Sheet */}
            <rect x="16" y="16" width="320" height="200" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Left Sidebar Column */}
            <rect x="28" y="28" width="94" height="176" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeDasharray="3 3" />
            <circle cx="75" cy="52" r="13" fill="#e2e8f0" />
            <rect x="40" y="76" width="70" height="6" rx="2" fill="#cbd5e1" />
            <rect x="40" y="90" width="52" height="5" rx="2" fill="#e2e8f0" />
            {/* Skill rating bars */}
            <rect x="40" y="114" width="70" height="6" rx="3" fill="#e2e8f0" />
            <rect x="40" y="114" width="54" height="6" rx="3" fill="#94a3b8" />
            <rect x="40" y="128" width="70" height="6" rx="3" fill="#e2e8f0" />
            <rect x="40" y="128" width="46" height="6" rx="3" fill="#94a3b8" />

            {/* Right Main Column */}
            <rect x="136" y="30" width="186" height="14" rx="3" fill="#1e293b" />
            <rect x="136" y="52" width="134" height="6" rx="2" fill="#94a3b8" />
            <rect x="136" y="76" width="182" height="7" rx="2" fill="#cbd5e1" />
            <rect x="136" y="90" width="164" height="7" rx="2" fill="#cbd5e1" />
            <rect x="136" y="104" width="174" height="7" rx="2" fill="#cbd5e1" />
            <rect x="136" y="128" width="182" height="7" rx="2" fill="#fecaca" />
            <rect x="136" y="142" width="146" height="7" rx="2" fill="#cbd5e1" />

            {/* Erratic Red Zigzag Parser Path */}
            <path
              d="M 40 79 L 136 37 L 40 117 L 136 79 L 40 131 L 136 131"
              fill="none"
              stroke="#b91c1c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-packet-flow"
            />

            {/* Exploded Blueprint Pointer Callouts */}
            <g>
              <line x1="122" y1="52" x2="348" y2="52" stroke="#b91c1c" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="122" cy="52" r="2.5" fill="#b91c1c" />
              <text x="354" y="49" fill="#991b1b" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                ERR_01
              </text>
              <text x="354" y="60" fill="#64748b" fontSize="8" fontFamily="monospace">
                COL_JUMP
              </text>
            </g>

            <g>
              <line x1="318" y1="131" x2="348" y2="131" stroke="#b91c1c" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="318" cy="131" r="2.5" fill="#b91c1c" />
              <text x="354" y="128" fill="#991b1b" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                ERR_02
              </text>
              <text x="354" y="139" fill="#64748b" fontSize="8" fontFamily="monospace">
                UNVERIFIED +45%
              </text>
            </g>

            {/* Parser Output Pill */}
            <rect x="136" y="168" width="186" height="24" rx="5" fill="#fef2f2" stroke="#fecaca" />
            <text x="144" y="184" fill="#991b1b" fontSize="9.5" fontFamily="monospace">
              &quot;Skills..4/5..+45%&quot; [SCRAMBLED]
            </text>
          </svg>
        </div>
      </div>

      {/* RIGHT: FactFit Single-Column Cotton Sheet (100% Linear ATS Read) */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-600/25 bg-white p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold tracking-[0.04em] text-emerald-800 uppercase">
              FactFit Single-Column PDF
            </span>
            <p className="mt-0.5 text-xs text-slate-600">
              Top-to-bottom linear flow with selectable text &amp; verified source&nbsp;metadata
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-emerald-800 tabular-nums">
            <IconCheck size={12} /> 100% Readable
          </span>
        </div>

        {/* Exploded Schematic */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-emerald-600/20 bg-emerald-50/20 p-4">
          <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
          <svg
            viewBox="0 0 460 232"
            className="relative z-10 w-full"
            role="img"
            aria-label="Diagram showing FactFit single-column resume parsed cleanly top to bottom"
          >
            {/* Outer A4 Sheet */}
            <rect x="16" y="16" width="320" height="200" rx="8" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1.5" />

            {/* Clean Single-Column Header */}
            <rect x="40" y="30" width="136" height="12" rx="3" fill="#0f172a" />
            <rect x="40" y="48" width="204" height="5" rx="2" fill="#64748b" />
            <line x1="40" y1="62" x2="316" y2="62" stroke="#e2e8f0" strokeWidth="1" />

            {/* Experience Section */}
            <rect x="40" y="72" width="74" height="6" rx="2" fill="#047857" />
            <rect x="40" y="86" width="212" height="7" rx="2" fill="#cbd5e1" />
            <rect x="40" y="100" width="194" height="7" rx="2" fill="#cbd5e1" />
            <rect x="40" y="114" width="206" height="7" rx="2" fill="#d1fae5" />

            {/* Provenance Citation Badges on Right Margin */}
            <rect x="266" y="84" width="48" height="12" rx="3" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="272" y="93" fill="#065f46" fontSize="8" fontFamily="monospace">cite:f1</text>

            <rect x="266" y="112" width="48" height="12" rx="3" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="272" y="121" fill="#065f46" fontSize="8" fontFamily="monospace">cite:f2</text>

            {/* Skills Section */}
            <rect x="40" y="138" width="54" height="6" rx="2" fill="#047857" />
            <rect x="40" y="150" width="248" height="6" rx="2" fill="#cbd5e1" />

            {/* Clean Top-to-Bottom Emerald Linear Read Path */}
            <path
              d="M 28 32 L 28 156"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-packet-flow"
            />
            <circle cx="28" cy="32" r="3" fill="#047857" />
            <path d="M 24 150 L 28 158 L 32 150" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Exploded Blueprint Pointer Callouts */}
            <g>
              <line x1="28" y1="75" x2="348" y2="75" stroke="#047857" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.45" />
              <circle cx="28" cy="75" r="2.5" fill="#047857" />
              <text x="354" y="72" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                SYS_01
              </text>
              <text x="354" y="83" fill="#475569" fontSize="8" fontFamily="monospace">
                LINEAR_READ
              </text>
            </g>

            <g>
              <line x1="314" y1="118" x2="348" y2="118" stroke="#047857" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.65" />
              <circle cx="314" cy="118" r="2.5" fill="#047857" />
              <text x="354" y="115" fill="#047857" fontSize="8.5" fontFamily="monospace" fontWeight="600">
                SYS_02
              </text>
              <text x="354" y="126" fill="#475569" fontSize="8" fontFamily="monospace">
                CITE_LOCKED
              </text>
            </g>

            {/* Parser Output Pill */}
            <rect x="40" y="168" width="276" height="24" rx="5" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="50" y="184" fill="#065f46" fontSize="9.5" fontFamily="monospace">
              Ordered 100% · Selectable · &lt; 2.5 MB PDF
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
