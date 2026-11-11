import Link from "next/link";
import type { Metadata } from "next";
import { getFactBank, listApplications } from "@/lib/data";
import { checkBullet } from "@/lib/core/guard";
import { matchRequirements } from "@/lib/core/match";
import { IconAlert, IconShield } from "@/components/icons";
import { ScoreBadge } from "@/components/score-badge";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const [apps, bank] = await Promise.all([listApplications(), getFactBank()]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">Applications</h1>
          <p className="mt-1 text-sm text-slate-600">One tailored resume version per job.</p>
        </div>
        <Link href="/app/applications/new" className="btn-primary">
          New application
        </Link>
      </header>

      {bank.facts.length === 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <IconAlert size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <p>
            Your fact bank is empty, so nothing can match yet.{" "}
            <Link href="/app/facts" className="font-medium underline underline-offset-2">
              Add your experience first
            </Link>
            .
          </p>
        </div>
      )}

      {apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
          <p className="font-medium text-slate-900">No applications yet</p>
          <p className="mt-1 text-sm text-slate-600">Paste a job description and FactFit checks it against your facts.</p>
          <Link href="/app/applications/new" className="btn mt-5">
            Paste a job description
          </Link>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-200/70 overflow-hidden">
          {apps.map((a) => {
            const blockedCount = a.bullets.filter((b) => !checkBullet(b, bank.facts, bank.experiences).ok).length;
            const hasVerified = a.bullets.length > 0 && blockedCount === 0;
            return (
              <li key={a.id}>
                <Link
                  href={`/app/applications/${a.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-colors duration-150 hover:bg-slate-50 sm:px-5"
                >
                  <ScoreBadge score={matchRequirements(a.analysis, bank.facts, bank.experiences).score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-slate-900">{a.role || "Untitled role"}</p>
                      {blockedCount > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 tabular-nums">
                          <IconAlert size={11} /> {blockedCount} blocked
                        </span>
                      ) : hasVerified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          <IconShield size={11} /> Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-slate-500">{a.company || "Company not set"}</p>
                  </div>
                  <span className="shrink-0 text-right text-xs text-slate-500 tabular-nums">
                    {a.bullets.length} {a.bullets.length === 1 ? "bullet" : "bullets"}
                    <span className="block">{a.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
