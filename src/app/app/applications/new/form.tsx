"use client";

import { useActionState } from "react";
import { createApplicationAction, type FormState } from "../../actions";

export function NewApplicationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createApplicationAction, {});
  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Company (optional)</span>
          <input name="company" className="input" />
        </label>
        <label className="block">
          <span className="label">Role (optional, read from the posting if empty)</span>
          <input name="role" className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Job description</span>
        <textarea name="jdText" required rows={16} className="input font-mono text-xs leading-relaxed" />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary">
        {pending ? "Analysing…" : "Analyse job"}
      </button>
    </form>
  );
}
