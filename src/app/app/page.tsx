import Link from "next/link";
import type { Metadata } from "next";
import { getFactBank, listApplications } from "@/lib/data";
import { ScoreBadge } from "@/components/score-badge";
import { matchRequirements } from "@/lib/core/match";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const [apps, bank] = await Promise.all([listApplications(), getFactBank()]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-stone-600">One tailored resume version per job.</p>
        </div>
        <Link href="/app/applications/new" className="btn-primary">
          New application
        </Link>
      </header>

      {bank.facts.length === 0 && (
        <div className="card border-amber-200 bg-amber-50 p-5 text-sm">
          Your fact bank is empty, so nothing can match yet.{" "}
          <Link href="/app/facts" className="font-medium underline">
            Add your experience first
          </Link>
          .
        </div>
      )}

      {apps.length === 0 ? (
        <p className="text-sm text-stone-500">No applications yet. Paste a job description to start one.</p>
      ) : (
        <ul className="card divide-y divide-stone-100">
          {apps.map((a) => (
            <li key={a.id}>
              <Link href={`/app/applications/${a.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50">
                <ScoreBadge score={matchRequirements(a.analysis, bank.facts).score} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.role || "Untitled role"}</p>
                  <p className="truncate text-sm text-stone-500">{a.company || "Company not set"}</p>
                </div>
                <span className="text-xs text-stone-500">
                  {a.bullets.length} bullets · {a.updatedAt.toLocaleDateString("en-GB")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
