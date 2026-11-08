// Building blocks for the settings tabs: a section with a heading, and rows with the
// label on the left and the control on the right (stacked on phones).

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-200 pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-base font-medium text-slate-900">{title}</h2>
      {description && <p className="mt-1 max-w-xl text-sm text-slate-600">{description}</p>}
      <div className="mt-4 divide-y divide-dashed divide-slate-200">{children}</div>
    </section>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-8">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint && <div className="mt-1 text-sm text-slate-500">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "neutral" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 ring-amber-600/20"
        : "bg-slate-100 text-slate-700 ring-slate-500/15";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${cls}`}>{children}</span>;
}

export function Notice({ tone, children }: { tone: "ok" | "error" | "info"; children: React.ReactNode }) {
  const cls =
    tone === "ok" ? "bg-emerald-50 text-emerald-900" : tone === "error" ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm ${cls}`}>
      {children}
    </p>
  );
}
