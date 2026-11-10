import Link from "next/link";
import type { Metadata } from "next";
import { getAccount, listSessions } from "@/lib/account";
import { googleEnabled } from "@/lib/site";
import { ConfirmButton } from "@/components/confirm-button";
import { IconCheck, IconMonitor, IconPhone } from "@/components/icons";
import { revokeSessionAction } from "../actions";
import { ChangePasswordForm, SignOutOthersButton } from "../forms";
import { Badge, Notice, Row, Section } from "../ui";

export const metadata: Metadata = { title: "Security" };

function ago(d: Date) {
  const min = Math.round((Date.now() - d.getTime()) / 60_000);
  if (min < 2) return "Active now";
  if (min < 60) return `${min} minutes ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.round(h / 24);
  return days < 30 ? `${days} day${days === 1 ? "" : "s"} ago` : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SecurityPage() {
  const account = await getAccount();
  // The demo is shared by every visitor; listing its sessions would show strangers' devices.
  const sessions = account.demo ? [] : await listSessions(account);
  const others = sessions?.filter((s) => !s.current).length ?? 0;

  // A checklist of things that are actually true or false for this account.
  const checks = [
    { ok: account.hasPassword, label: "Password set", fix: { href: "#password", text: "Set one" } },
    ...(googleEnabled() ? [{ ok: Boolean(account.google), label: "A second way to sign in (Google)", fix: { href: "/app/settings", text: "Connect" } }] : []),
    { ok: sessions !== null && others === 0, label: "No other devices signed in", fix: { href: "#devices", text: "Review" } },
  ];
  const done = checks.filter((c) => c.ok).length;

  return (
    <div className="space-y-8">
      {account.demo && (
        <Notice tone="info">This is the shared demo account, so its password and devices are locked and hidden.</Notice>
      )}

      {!account.demo && (
        <div className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <ChecklistRing done={done} total={checks.length} />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">
              {done === checks.length ? "Your account is in good shape" : `${done} of ${checks.length} security steps done`}
            </p>
            <ul className="mt-2 space-y-1.5">
              {checks.map((c) => (
                <li key={c.label} className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    aria-hidden
                    className={`grid size-5 place-items-center rounded-full ${c.ok ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}
                  >
                    {c.ok ? <IconCheck size={12} strokeWidth={2.5} /> : "·"}
                  </span>
                  <span className={c.ok ? "text-slate-700" : "text-slate-900"}>{c.label}</span>
                  <span className="sr-only">{c.ok ? "(done)" : "(to do)"}</span>
                  {!c.ok && (
                    <Link href={c.fix.href} className="text-sm font-medium text-slate-800 underline underline-offset-2">
                      {c.fix.text}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div id="password" className="scroll-mt-8">
        <Section
          title={account.hasPassword ? "Password" : "Set a password"}
          description={
            account.hasPassword
              ? "Use at least 10 characters with letters and numbers. You'll need your current password to change it."
              : "You sign in with Google. A password gives you a second way in."
          }
        >
          <Row label={account.hasPassword ? "Change password" : "New password"} hint="The eye button shows what you typed.">
            <ChangePasswordForm hasPassword={account.hasPassword} email={account.email} disabled={account.demo} />
          </Row>
        </Section>
      </div>

      {!account.demo && (
        <div id="devices" className="scroll-mt-8">
          <Section
            title="Signed-in devices"
            description={"Browsers where this account is signed in now. Sign out any you don't recognise, then change your\u00A0password."}
          >
            {sessions === null ? (
              <Row label="Devices">
                <p className="text-sm text-slate-600">The device list isn&apos;t available here, but you can still sign out everywhere else.</p>
              </Row>
            ) : (
              <ul className="divide-y divide-dashed divide-slate-200">
                {sessions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 py-4">
                    <span className="icon-tile size-9 bg-slate-100 text-slate-600">
                      {s.kind === "mobile" ? <IconPhone size={18} /> : <IconMonitor size={18} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                        {s.device}
                        {s.current && <Badge tone="ok">This device</Badge>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[s.ip, ago(s.lastActive), `signed in ${s.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {!s.current && (
                      <form action={revokeSessionAction.bind(null, s.id)}>
                        <ConfirmButton confirm={`Sign out ${s.device}?`} className="btn btn-sm" aria-label={`Sign out ${s.device}`}>
                          Sign out
                        </ConfirmButton>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="pt-5">
              <SignOutOthersButton disabled={sessions !== null && others === 0} />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function ChecklistRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const ok = done === total;
  return (
    <span role="img" aria-label={`${done} of ${total} security steps done`} className="relative grid size-16 shrink-0 place-items-center">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-slate-100" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - done / total)}
          className={`ring-animate ${ok ? "stroke-emerald-600" : "stroke-slate-700"}`}
          style={{ "--ring-length": c } as React.CSSProperties}
        />
      </svg>
      <span aria-hidden className="absolute text-sm font-semibold text-slate-900 tabular-nums">
        {done}/{total}
      </span>
    </span>
  );
}
