"use client";

import { useActionState, useState } from "react";
import { authAction, type AuthState } from "./actions";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, action, pending] = useActionState<AuthState, FormData>(authAction, {});

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 rounded-lg bg-stone-100 p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md py-1.5 ${mode === m ? "bg-white font-medium shadow-sm" : "text-stone-500"}`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <input type="hidden" name="mode" value={mode} />
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="input"
        />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      <button disabled={pending} className="btn-primary w-full">
        {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
