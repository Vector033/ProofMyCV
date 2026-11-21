"use client";

import { useState } from "react";

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const isYear = (v: string) => /^\d{4}$/.test(v);

/**
 * Start and end dates with one-click presets. An empty end means "Present".
 * A year on its own ("2024") stays a year: no month is made up for it.
 */
export function DateFields({ start: s0, end: e0 }: { start?: string | null; end?: string | null }) {
  const [start, setStart] = useState(s0 ?? "");
  const [end, setEnd] = useState(e0 ?? "");
  const [ongoing, setOngoing] = useState(Boolean(s0) && !e0);
  const [version, setVersion] = useState(0); // remounts the inputs so a preset can switch month/year mode

  const now = new Date();
  const y = now.getFullYear();
  const coop = now.getMonth() >= 5 ? y + 1 : y; // the next June–October co-op term
  const presets = [
    { label: "This month", s: ym(now), e: ym(now) },
    { label: `Jun–Oct ${coop} co-op`, s: `${coop}-06`, e: `${coop}-10` },
    ...[y, y - 1, y - 2].map((yr) => ({ label: `${yr} – Present`, s: String(yr), e: "" })),
  ];
  const apply = (s: string, e: string) => {
    setStart(s);
    setEnd(e);
    setOngoing(!e);
    setVersion((v) => v + 1);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="label">Dates</legend>
      <div role="group" aria-label="Date presets" className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const on = start === p.s && end === p.e;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={on}
              onClick={() => apply(p.s, p.e)}
              className={`press inline-flex min-h-11 items-center rounded-full border px-3 text-sm tabular-nums md:min-h-8 ${
                on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DateInput key={`s${version}`} name="startDate" label="Start" value={start} onChange={setStart} />
        <DateInput key={`e${version}`} name="endDate" label="End" value={ongoing ? "" : end} onChange={setEnd} disabled={ongoing} />
      </div>
      <label className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={ongoing}
          onChange={(ev) => {
            setOngoing(ev.target.checked);
            if (ev.target.checked) setEnd("");
          }}
          className="size-4 accent-emerald-700"
        />
        Ongoing (prints as &ldquo;Present&rdquo;)
      </label>
    </fieldset>
  );
}

function DateInput({
  name,
  label,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [yearOnly, setYearOnly] = useState(isYear(value));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`${name}-input`} className="label">
          {label}
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              onChange(yearOnly ? "" : value.slice(0, 4));
              setYearOnly(!yearOnly);
            }}
            className="mb-1.5 inline-flex min-h-11 items-center text-xs text-slate-600 underline underline-offset-2 hover:text-slate-900 md:min-h-0"
          >
            {yearOnly ? "Pick a month" : "Year only"}
          </button>
        )}
      </div>
      <input
        id={`${name}-input`}
        name={disabled ? undefined : name}
        type={yearOnly ? "number" : "month"}
        min={yearOnly ? 1950 : undefined}
        max={yearOnly ? 2100 : undefined}
        value={value}
        disabled={disabled}
        onChange={(ev) => onChange(ev.target.value)}
        className="input tabular-nums disabled:bg-slate-100 disabled:text-slate-500"
      />
      {/* A disabled input is not submitted; send the empty end date ("Present") explicitly. */}
      {disabled && <input type="hidden" name={name} value="" />}
    </div>
  );
}
