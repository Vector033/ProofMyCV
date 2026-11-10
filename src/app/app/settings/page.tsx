import Link from "next/link";
import type { Metadata } from "next";
import { getAccount } from "@/lib/account";
import { googleEnabled } from "@/lib/site";
import { GoogleMark, IconKey } from "@/components/icons";
import { GoogleLinkButton, GoogleUnlinkButton } from "./forms";
import { Badge, Notice, Row, Section } from "./ui";

export const metadata: Metadata = { title: "Account" };

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Unknown";

const OAUTH: Record<string, { tone: "ok" | "error"; text: string }> = {
  cancelled: { tone: "error", text: "Connecting Google was cancelled." },
  failed: { tone: "error", text: "Google didn't connect. That Google account may already belong to another FactFit account." },
};

export default async function AccountPage({ searchParams }: PageProps<"/app/settings">) {
  const [account, params] = await Promise.all([getAccount(), searchParams]);
  const google = googleEnabled();
  const oauth = typeof params.oauth === "string" ? OAUTH[params.oauth] : undefined;

  return (
    <div className="space-y-8">
      {params.linked === "google" && <Notice tone="ok">Google is connected. You can use it to sign in from now on.</Notice>}
      {oauth && <Notice tone={oauth.tone}>{oauth.text}</Notice>}
      {account.demo && (
        <Notice tone="info">This is the shared demo account. You can look around, but its sign-in settings are locked.</Notice>
      )}

      <Section title="Profile" description="Who you are signed in as.">
        <Row label="Email" hint="Used to sign in. FactFit never emails you.">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-900 [overflow-wrap:anywhere]">{account.email}</span>
            <Badge>Primary</Badge>
          </div>
        </Row>
        <Row label="Member since">
          <p className="text-sm text-slate-700">{date(account.createdAt)}</p>
        </Row>
        <Row label="Last sign-in">
          <p className="text-sm text-slate-700">{date(account.lastSignInAt)}</p>
        </Row>
        <Row label="Name on your resume" hint="Your name, headline and links for the PDF.">
          <Link href="/app/facts#resume-header" className="text-sm font-medium text-slate-800 underline underline-offset-2">
            Edit in Fact bank
          </Link>
        </Row>
      </Section>

      <Section title="Sign-in methods" description={"Ways you can get into this account. Keep at least two, in case one stops\u00A0working."}>
        <Row label="Email and password">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="icon-tile size-9">
                <IconKey size={18} />
              </span>
              <div>
                <p className="text-sm text-slate-900">Password</p>
                <p className="text-xs text-slate-500">{account.hasPassword ? "Set" : "Not set yet"}</p>
              </div>
            </div>
            <Link href="/app/settings/security#password" className="btn btn-sm">
              {account.hasPassword ? "Change" : "Set a password"}
            </Link>
          </div>
        </Row>
        <Row label="Google" hint={google ? undefined : "Not available on this server yet."}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white">
                <GoogleMark />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-slate-900">Google account</p>
                <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                  {account.google ? `Connected${account.google.email ? ` as ${account.google.email}` : ""}` : "Not connected"}
                </p>
              </div>
            </div>
            {account.google ? (
              <GoogleUnlinkButton
                disabledReason={
                  account.demo ? "Locked on the demo account." : !account.hasPassword ? "Set a password before disconnecting." : undefined
                }
              />
            ) : google && !account.demo ? (
              <GoogleLinkButton />
            ) : null}
          </div>
        </Row>
      </Section>
    </div>
  );
}
