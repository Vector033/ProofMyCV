"use client";

import { useActionState, useState } from "react";
import { GoogleMark, IconAlert, IconCheck } from "@/components/icons";
import { PasswordInput, PasswordRules } from "@/components/password-input";
import { authAction, googleSignInAction, type AuthState } from "./actions";

const MODES = { signin: "Sign in", signup: "Create account" } as const;

export function LoginForm({ google, oauthError }: { google: boolean; oauthError?: string }) {
  const [mode, setMode] = useState<keyof typeof MODES>("signin");
  // Controlled so a failed attempt keeps what was typed (React resets forms after an action).
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState<AuthState, FormData>(authAction, {});

  return (
    <div className="space-y-5">
      {/* Container rounded-lg (8px) + p-1 (4px) -> inner tab buttons rounded (4px) */}
      <div role="group" aria-label="Account" className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm">
        {(Object.keys(MODES) as (keyof typeof MODES)[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded transition-colors duration-150 ${
              mode === m ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {MODES[m]}
          </button>
        ))}
      </div>

      {google && (
        <>
          <GoogleButton error={oauthError} />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            or with email
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={mode === "signup" ? 10 : 8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "signup" && <PasswordRules value={password} email={email} />}
        </div>
        {state.error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            <IconAlert size={16} className="mt-0.5 shrink-0 text-red-700" />
            <span>{state.error}</span>
          </p>
        )}
        {state.message && (
          <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <IconCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />
            <span>{state.message}</span>
          </p>
        )}
        <button disabled={pending} className="btn-primary w-full">
          {pending ? (mode === "signin" ? "Signing in…" : "Creating your account…") : MODES[mode]}
        </button>
      </form>
    </div>
  );
}

function GoogleButton({ error }: { error?: string }) {
  const [state, action, pending] = useActionState<AuthState>(googleSignInAction, {});
  const message = state.error ?? error;
  return (
    <form action={action}>
      <button disabled={pending} className="btn w-full">
        <GoogleMark />
        {pending ? "Opening Google…" : "Continue with Google"}
      </button>
      {message && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
          <IconAlert size={15} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </form>
  );
}
