"use client";

import { useFormStatus } from "react-dom";

/** Re-analysis waits on the AI for up to a minute: say so, and block a second submit. */
export function ReanalyseButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button className="btn btn-sm" disabled={pending}>
        {pending ? "Analysing…" : "Re-analyse"}
      </button>
      <span role="status" className="text-slate-500">
        {pending ? "This can take up to a minute." : ""}
      </span>
    </>
  );
}
