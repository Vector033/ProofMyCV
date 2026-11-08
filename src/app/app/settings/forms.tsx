"use client";

import { useActionState, useState } from "react";
import { GoogleMark } from "@/components/icons";
import { PasswordInput, PasswordRules } from "@/components/password-input";
import {
  changePasswordAction,
  linkGoogleAction,
  signOutOthersAction,
  unlinkGoogleAction,
  type SettingsState,
} from "./actions";
import { Notice } from "./ui";

function Result({ state }: { state: SettingsState }) {
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (state.message) return <Notice tone="ok">{state.message}</Notice>;
  return null;
}

export function GoogleLinkButton() {
  const [state, action, pending] = useActionState<SettingsState>(linkGoogleAction, {});
  return (
    <form action={action} className="space-y-2">
      <button disabled={pending} className="btn">
        <GoogleMark />
        {pending ? "Opening Google…" : "Connect Google"}
      </button>
      <Result state={state} />
    </form>
  );
}

export function GoogleUnlinkButton({ disabledReason }: { disabledReason?: string }) {
  const [state, action, pending] = useActionState<SettingsState>(unlinkGoogleAction, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Disconnect Google? You will sign in with your email and password instead.")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <button disabled={pending || Boolean(disabledReason)} className="btn btn-sm text-red-700 hover:border-red-300 hover:bg-red-50">
        {pending ? "Disconnecting…" : "Disconnect"}
      </button>
      {disabledReason && <p className="text-xs text-slate-500">{disabledReason}</p>}
      <Result state={state} />
    </form>
  );
}

export function ChangePasswordForm({ hasPassword, email, disabled }: { hasPassword: boolean; email: string; disabled?: boolean }) {
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  // Clear the new password once it is saved; keep it on an error so nothing is retyped.
  const [state, action, pending] = useActionState<SettingsState, FormData>(async (prev, fd) => {
    const result = await changePasswordAction(prev, fd);
    if (result.message) {
      setNext("");
      setConfirm("");
    }
    return result;
  }, {});
  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <form action={action} className="max-w-md space-y-4">
      <fieldset disabled={disabled || pending} className="space-y-4 disabled:opacity-60">
        {/* Lets password managers attach the new password to the right account. */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
        {hasPassword && (
          <div>
            <label htmlFor="current" className="label">
              Current password
            </label>
            <PasswordInput id="current" name="current" required autoComplete="current-password" />
          </div>
        )}
        <div>
          <label htmlFor="new-password" className="label">
            {hasPassword ? "New password" : "Password"}
          </label>
          <PasswordInput
            id="new-password"
            name="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <PasswordRules value={next} email={email} />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Type it again
          </label>
          <PasswordInput
            id="confirm"
            name="confirm"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "confirm-hint" : undefined}
          />
          {mismatch && (
            <p id="confirm-hint" className="mt-1 text-xs text-red-700">
              Doesn&apos;t match the new password yet.
            </p>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="signOutOthers" defaultChecked className="mt-0.5 size-4 accent-slate-800" />
          Sign out my other devices
        </label>
        <button className="btn-primary">{pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}</button>
      </fieldset>
      <Result state={state} />
    </form>
  );
}

export function SignOutOthersButton({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<SettingsState>(signOutOthersAction, {});
  return (
    <form action={action} className="space-y-2">
      <button disabled={disabled || pending} className="btn">
        {pending ? "Signing out…" : "Sign out all other devices"}
      </button>
      <Result state={state} />
    </form>
  );
}
