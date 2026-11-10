"use client";

/**
 * Vector schematic comparing how legacy ATS parsers misread multi-column AI templates
 * versus FactFit's single-column, fact-cited cotton PDF layout.
 */
export function AtsAnatomy() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: Multi-column AI Template (Broken Parser Path) */}
      <div className="relative overflow-hidden rounded-2xl border border-red-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold tracking-wider text-red-700 uppercase">
              Multi-Column AI Template
            </span>
            <p className="mt-0.5 text-xs text-slate-600">
              Sidebars, tables, and icons scramble ATS line-by-line text extraction
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800 tabular-nums">
            Parser Collisions
          </span>
        </div>

        {/* SVG Schematic */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
          <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
          <svg
            viewBox="0 0 420 220"
            className="relative z-10 w-full"
            role="img"
            aria-label="Diagram showing a multi-column resume causing erratic ATS parser line jumps"
          >
            {/* Outer A4 Sheet */}
            <rect x="20" y="10" width="380" height="200" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Left Sidebar Column */}
            <rect x="32" y="22" width="108" height="176" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 3" />
            <circle cx="86" cy="48" r="14" fill="#e2e8f0" />
            <rect x="46" y="74" width="80" height="6" rx="2" fill="#cbd5e1" />
            <rect x="46" y="88" width="60" height="5" rx="2" fill="#e2e8f0" />
            {/* Skill rating bars (ATS cannot read) */}
            <rect x="46" y="114" width="80" height="6" rx="3" fill="#e2e8f0" />
            <rect x="46" y="114" width="64" height="6" rx="3" fill="#94a3b8" />
            <rect x="46" y="128" width="80" height="6" rx="3" fill="#e2e8f0" />
            <rect x="46" y="128" width="52" height="6" rx="3" fill="#94a3b8" />

            {/* Right Main Column */}
            <rect x="156" y="24" width="228" height="14" rx="3" fill="#1e293b" />
            <rect x="156" y="46" width="160" height="6" rx="2" fill="#94a3b8" />
            <rect x="156" y="72" width="220" height="7" rx="2" fill="#cbd5e1" />
            <rect x="156" y="86" width="196" height="7" rx="2" fill="#cbd5e1" />
            <rect x="156" y="100" width="210" height="7" rx="2" fill="#cbd5e1" />
            <rect x="156" y="126" width="224" height="7" rx="2" fill="#fecaca" />
            <rect x="156" y="140" width="180" height="7" rx="2" fill="#cbd5e1" />

            {/* Erratic Red Zigzag Parser Path */}
            <path
              d="M 46 77 L 156 31 L 46 117 L 156 75 L 46 131 L 156 129"
              fill="none"
              stroke="#b91c1c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-packet-flow"
            />

            {/* Parser Output Pill */}
            <rect x="156" y="164" width="228" height="24" rx="5" fill="#fef2f2" stroke="#fecaca" />
            <text x="166" y="180" fill="#991b1b" fontSize="10" fontFamily="monospace">
              Output: &quot;Skills... 4/5... Led +45%&quot; [SCRAMBLED]
            </text>
          </svg>
        </div>
      </div>

      {/* RIGHT: FactFit Single-Column Cotton Sheet (100% Linear ATS Read) */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-600/25 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">
              FactFit Single-Column PDF
            </span>
            <p className="mt-0.5 text-xs text-slate-600">
              Top-to-bottom linear flow with selectable text &amp; verified source metadata
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 tabular-nums">
            100% Readable
          </span>
        </div>

        {/* SVG Schematic */}
        <div className="relative mt-4 overflow-hidden rounded-xl border border-emerald-600/20 bg-emerald-50/20 p-4">
          <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
          <svg
            viewBox="0 0 420 220"
            className="relative z-10 w-full"
            role="img"
            aria-label="Diagram showing FactFit single-column resume parsed cleanly top to bottom"
          >
            {/* Outer A4 Sheet */}
            <rect x="20" y="10" width="380" height="200" rx="8" fill="#ffffff" stroke="#d1fae5" strokeWidth="1.5" />

            {/* Clean Single-Column Header */}
            <rect x="44" y="24" width="150" height="12" rx="3" fill="#0f172a" />
            <rect x="44" y="42" width="230" height="5" rx="2" fill="#64748b" />
            <line x1="44" y1="56" x2="376" y2="56" stroke="#e2e8f0" strokeWidth="1" />

            {/* Experience Section */}
            <rect x="44" y="66" width="84" height="6" rx="2" fill="#047857" />
            <rect x="44" y="80" width="268" height="7" rx="2" fill="#cbd5e1" />
            <rect x="44" y="94" width="246" height="7" rx="2" fill="#cbd5e1" />
            <rect x="44" y="108" width="258" height="7" rx="2" fill="#d1fae5" />

            {/* Provenance Citation Badges on Right Margin (metadata trace) */}
            <rect x="328" y="78" width="48" height="12" rx="3" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="334" y="87" fill="#065f46" fontSize="8" fontFamily="monospace">cite:f1</text>

            <rect x="328" y="106" width="48" height="12" rx="3" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="334" y="115" fill="#065f46" fontSize="8" fontFamily="monospace">cite:f2</text>

            {/* Skills Section */}
            <rect x="44" y="132" width="60" height="6" rx="2" fill="#047857" />
            <rect x="44" y="144" width="290" height="6" rx="2" fill="#cbd5e1" />

            {/* Clean Top-to-Bottom Emerald Linear Read Path */}
            <path
              d="M 34 26 L 34 150"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-packet-flow"
            />
            <circle cx="34" cy="26" r="3" fill="#047857" />
            <path d="M 30 144 L 34 152 L 38 144" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Parser Output Pill */}
            <rect x="44" y="164" width="332" height="24" rx="5" fill="#ecfdf5" stroke="#a7f3d0" />
            <text x="54" y="180" fill="#065f46" fontSize="10" fontFamily="monospace">
              Output: Ordered 100% · Selectable Text · &lt; 2.5 MB PDF
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
