"use client";

import { useFormStatus } from "react-dom";
import { IconLogout } from "@/components/icons";

/** Header sign-out button with immediate pending and disabled feedback. */
export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={pending ? "Signing out…" : "Sign out"}
      title={pending ? "Signing out…" : "Sign out"}
      className={`btn-ghost text-slate-600 ${pending ? "min-h-11 gap-1.5 px-2.5 opacity-75" : "size-11"}`}
    >
      <IconLogout className="shrink-0" />
      {pending && <span className="whitespace-nowrap text-xs font-medium">Signing out…</span>}
    </button>
  );
}
