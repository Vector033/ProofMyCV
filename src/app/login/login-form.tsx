"use client";

import { useActionState, useState } from "react";
import { authAction, type AuthState } from "./actions";

const MODES = { signin: "Sign in", signup: "Create account" } as const;

export function LoginForm() {
  const [mode, setMode] = useState<keyof typeof MODES>("signin");
  const [state, action, pending] = useActionState<AuthState, FormData>(authAction, {});

  return (
    <form action={action} className="space-y-4">
      <div role="group" aria-label="Account" className="grid grid-cols-2 rounded-lg bg-stone-100 p-1 text-sm">
        {(Object.keys(MODES) as (keyof typeof MODES)[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-9 rounded-md transition-colors duration-150 ${
              mode === m ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {MODES[m]}
          </button>
        ))}
      </div>
      <input type="hidden" name="mode" value={mode} />
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" spellCheck={false} className="input" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 10 : 8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          aria-describedby={mode === "signup" ? "pw-hint" : undefined}
          className="input"
        />
        {mode === "signup" && (
          <span id="pw-hint" className="hint">
            At least 10 characters.
          </span>
        )}
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message}
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? (mode === "signin" ? "Signing in…" : "Creating your account…") : MODES[mode]}
      </button>
    </form>
  );
}
