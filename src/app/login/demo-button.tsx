"use client";

import { useActionState } from "react";
import { demoLoginAction, type AuthState } from "./actions";

/** Opens the shared demo account (fictional data) in one click. */
export function DemoButton({ className = "btn w-full", label = "Try the demo account" }: { className?: string; label?: string }) {
  const [state, action, pending] = useActionState<AuthState>(demoLoginAction, {});
  return (
    <form action={action}>
      <button disabled={pending} className={className}>
        {pending ? "Opening the demo…" : label}
      </button>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
