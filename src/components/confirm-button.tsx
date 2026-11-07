"use client";

import type { ButtonHTMLAttributes } from "react";

/** A submit button that asks before a destructive server action runs. */
export function ConfirmButton({ confirm: message, ...props }: { confirm: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    />
  );
}
