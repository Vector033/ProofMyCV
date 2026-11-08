"use client";

import { useState, type InputHTMLAttributes } from "react";
import { passwordRules } from "@/lib/password";
import { IconEye, IconEyeOff } from "./icons";

/**
 * A password field with a show/hide button. The button is a real <button> with a
 * name that says what it will do, and it never submits the form.
 */
export function PasswordInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? "text" : "password"}
        spellCheck={false}
        autoCapitalize="off"
        className={`input pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-slate-500 hover:text-slate-800"
      >
        {shown ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  );
}

/** Live checklist under a new-password field. Mirrors the server's rules. */
export function PasswordRules({ value, email }: { value: string; email?: string }) {
  const rules = passwordRules(value, email);
  return (
    <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {rules.map((r) => (
        <li key={r.label} className={`flex items-center gap-1.5 ${r.ok ? "text-emerald-800" : "text-slate-500"}`}>
          <span aria-hidden className={`grid size-4 place-items-center rounded-full ${r.ok ? "bg-emerald-100" : "bg-slate-100"}`}>
            {r.ok ? "✓" : "·"}
          </span>
          {r.label}
          <span className="sr-only">{r.ok ? "(done)" : "(not yet)"}</span>
        </li>
      ))}
    </ul>
  );
}
