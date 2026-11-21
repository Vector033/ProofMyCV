"use client";

import { useState } from "react";
import { IconCheck } from "@/components/icons";

/**
 * The fact's technologies: click a chip to add or remove it, or type others.
 * Submits the same comma-separated "tech" field as before.
 */
export function TechChips({ initial = [], suggestions }: { initial?: string[]; suggestions: string[] }) {
  const [value, setValue] = useState(initial.join(", "));
  const list = value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const has = (t: string) => list.some((x) => x.toLowerCase() === t.toLowerCase());
  const toggle = (t: string) =>
    setValue((has(t) ? list.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...list, t]).join(", "));
  const chips = [...list, ...suggestions.filter((s) => !has(s))].slice(0, 18);

  return (
    <fieldset>
      <legend className="label">Technologies</legend>
      <div role="group" aria-label="Pick technologies" className="flex flex-wrap gap-2">
        {chips.map((t) => {
          const on = has(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(t)}
              className={`press inline-flex min-h-11 items-center rounded-full border px-3 text-sm md:min-h-8 ${
                on ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {on ? <IconCheck size={13} className="mr-1" /> : <span aria-hidden className="mr-1">+</span>}
              {t}
            </button>
          );
        })}
      </div>
      <input
        name="tech"
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
        aria-label="Technologies, comma separated"
        placeholder="Or type others, comma separated"
        className="input mt-3"
      />
    </fieldset>
  );
}
