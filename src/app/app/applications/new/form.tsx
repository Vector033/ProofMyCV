"use client";

import { useActionState } from "react";
import { createApplicationAction, type FormState } from "../../actions";

export function NewApplicationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createApplicationAction, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Company (optional)</span>
          <input name="company" defaultValue={v.company} placeholder="e.g. Lanna Logistics" className="input" />
        </label>
        <label className="block">
          <span className="label">Role (optional, read from the posting if empty)</span>
          <input name="role" defaultValue={v.role} placeholder="e.g. Software Engineering Intern" className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Job description</span>
        <textarea
          name="jdText"
          required
          minLength={80}
          rows={16}
          defaultValue={v.jdText}
          placeholder="Paste the whole posting: responsibilities, requirements and nice-to-haves."
          aria-describedby="jd-hint"
          className="input leading-relaxed"
        />
        <span id="jd-hint" className="hint">At least a few lines (80+ characters). The more of the posting you paste, the better the match.</span>
      </label>
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn-primary">
        {pending ? "Analysing the posting…" : "Analyse job"}
      </button>
    </form>
  );
}
