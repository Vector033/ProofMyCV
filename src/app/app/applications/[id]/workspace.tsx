"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { checkBullet } from "@/lib/core/guard";
import { bulletsEqual } from "@/lib/core/bullets";
import { CAREER_TRACKS } from "@/lib/core/jd";
import { matchRequirements } from "@/lib/core/match";
import type { BulletDraft, Experience, Fact, JobAnalysis } from "@/lib/core/types";
import { canonicalTech } from "@/lib/core/vocab";
import { ConfirmButton } from "@/components/confirm-button";
import { IconAlert, IconCheck, IconDownload, IconMinus, IconPlus, IconShield, IconX } from "@/components/icons";
import { ScoreBadge } from "@/components/score-badge";
import { deleteApplicationAction, quickAddFactAction, reanalyseApplicationAction } from "../../actions";
import { TechChips } from "../../facts/tech-chips";
import { BulletStudio } from "./bullet-studio";
import { PdfPreview } from "./pdf-preview";
import { ReanalyseButton } from "./reanalyse-button";

type Props = {
  application: {
    id: string;
    company: string;
    role: string;
    analyzedBy: string;
    analysis: JobAnalysis;
    bullets: BulletDraft[];
  };
  profile: {
    fullName: string;
    headline: string;
    contact: string;
    links: string;
  };
  initialExperiences: Experience[];
  initialFacts: Fact[];
  canGenerate: boolean;
  reanalysed?: string;
  statusForm: React.ReactNode;
};

const KIND_OPTIONS: { value: Experience["kind"]; label: string }[] = [
  { value: "job", label: "Work" },
  { value: "project", label: "Project" },
  { value: "education", label: "Education" },
  { value: "activity", label: "Activity" },
];

export function ApplicationWorkspace({
  application,
  profile,
  initialExperiences,
  initialFacts,
  canGenerate,
  reanalysed,
  statusForm,
}: Props) {
  const [addedExperiences, setAddedExperiences] = useState<Experience[]>([]);
  const [addedFacts, setAddedFacts] = useState<Fact[]>([]);
  const [bullets, setBullets] = useState<BulletDraft[]>(application.bullets);
  const [savedBullets, setSavedBullets] = useState<BulletDraft[]>(application.bullets);
  const [previewOpen, setPreviewOpen] = useState(false);

  const experiences = useMemo(() => {
    const ids = new Set(initialExperiences.map((e) => e.id));
    return [...initialExperiences, ...addedExperiences.filter((e) => !ids.has(e.id))];
  }, [initialExperiences, addedExperiences]);

  const facts = useMemo(() => {
    const ids = new Set(initialFacts.map((f) => f.id));
    return [...initialFacts, ...addedFacts.filter((f) => !ids.has(f.id))];
  }, [initialFacts, addedFacts]);

  // Sticky workspace bar visibility: appears when the main application header scrolls past the top nav.
  const headerRef = useRef<HTMLElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.top < 80);
      },
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const report = useMemo(() => matchRequirements(application.analysis, facts, experiences), [application.analysis, facts, experiences]);
  const factById = useMemo(() => new Map(facts.map((f) => [f.id, f])), [facts]);
  const missing = useMemo(() => report.matches.filter((m) => m.factIds.length === 0), [report.matches]);
  const covered = useMemo(() => report.matches.filter((m) => m.factIds.length > 0), [report.matches]);

  const blockedBullets = useMemo(
    () => bullets.filter((b) => !checkBullet(b, facts, experiences).ok).length,
    [bullets, facts, experiences],
  );
  const traceableBullets = bullets.length - blockedBullets;
  const dirty = useMemo(() => !bulletsEqual(bullets, savedBullets), [bullets, savedBullets]);

  const pdfHref = `/app/applications/${application.id}/pdf`;

  return (
    <div className="space-y-8">
      {/* Sticky Application Workspace Bar */}
      <div
        aria-hidden={!showStickyBar}
        inert={!showStickyBar}
        className={`fluted-glass fixed inset-x-0 top-0 z-[19] border-b border-slate-200/80 shadow-xs transition-all duration-200 ease-[var(--ease-out)] motion-reduce:transition-none md:top-16 ${
          showStickyBar ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0 motion-reduce:translate-y-0"
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 sm:px-8 md:h-12 md:flex-nowrap md:py-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <ScoreBadge score={report.score} size="sm" />
            <span className="hidden max-w-[11rem] truncate text-sm font-medium text-slate-900 lg:inline">
              {application.role || "Untitled role"}
            </span>
            {blockedBullets > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 tabular-nums">
                <IconAlert size={12} /> {traceableBullets} of {bullets.length} traceable
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 tabular-nums">
                <IconShield size={12} /> {bullets.length} of {bullets.length} traceable
              </span>
            )}
          </div>

          <nav aria-label="Application sections" className="flex items-center gap-1">
            <a href="#requirements" className="btn-ghost px-2.5 text-xs font-medium text-slate-700">
              Requirements
            </a>
            <a href="#bullet-studio" className="btn-ghost px-2.5 text-xs font-medium text-slate-700">
              Bullet Studio
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setPreviewOpen(true)} className="btn btn-sm">
              Preview
            </button>
            <a href={pdfHref} download className="btn-primary btn-sm min-h-8 px-3 text-xs">
              <IconDownload size={14} />
              Export PDF
            </a>
          </div>
        </div>
      </div>

      {/* Application Header */}
      <header ref={headerRef} className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <ScoreBadge score={report.score} size="lg" animate />
        <div className="min-w-[12rem] flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-balance [overflow-wrap:anywhere]">
              {application.role || "Untitled role"}
            </h1>
            {blockedBullets > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 tabular-nums">
                <IconAlert size={12} /> {blockedBullets} blocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 tabular-nums">
                <IconShield size={12} /> {bullets.length > 0 ? `${bullets.length} of ${bullets.length} traceable` : "Fact Guard Ready"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-slate-600 [overflow-wrap:anywhere]">{application.company || "Company not set"}</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {report.covered} of {report.total} requirements backed by your facts · analysed by {application.analyzedBy}
          </p>
          <form action={reanalyseApplicationAction.bind(null, application.id)} className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <label htmlFor="reanalyse-track">Analyse again for</label>
            <select id="reanalyse-track" name="track" defaultValue="" className="input w-auto py-1 text-xs sm:text-xs">
              <option value="">any track</option>
              {CAREER_TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ReanalyseButton />
          </form>
          {reanalysed === "1" && (
            <p role="status" className="mt-2 text-xs text-emerald-800">
              Analysed again. Your bullets are unchanged.
            </p>
          )}
          {reanalysed === "failed" && (
            <p role="alert" className="mt-2 text-xs text-red-800">
              The AI could not analyse the posting just now, so the earlier analysis is kept. Try again in a minute.
            </p>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <a href={pdfHref} download className="btn-primary flex-1 sm:flex-initial">
            <IconDownload size={16} />
            Export PDF
          </a>
          <button type="button" className="btn min-h-11" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
          <form action={deleteApplicationAction.bind(null, application.id)}>
            <ConfirmButton
              confirm={`Delete the application for ${application.role || "this role"}? Its saved bullets cannot be recovered.`}
              className="btn min-h-11 text-red-700 hover:border-red-300 hover:bg-red-50"
            >
              Delete
            </ConfirmButton>
          </form>
        </div>
      </header>

      {statusForm}

      {/* Requirements Mapping & Inline Quick-Add */}
      <section id="requirements" className="grid scroll-mt-32 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card min-w-0 p-5">
          <h2 className="font-medium">Backed by your facts</h2>
          {covered.length === 0 && <p className="mt-3 text-sm text-slate-500">No matches yet.</p>}
          <ul className="mt-3 space-y-3">
            {covered.map((m) => (
              <li key={m.requirement.name} className="text-sm">
                <RequirementName requirement={m.requirement} tone="ok" />
                <ul className="mt-1 space-y-0.5 pl-4 text-xs text-slate-600">
                  {m.factIds.slice(0, 3).map((fid) => (
                    <li key={fid} className="line-clamp-2 [overflow-wrap:anywhere]">
                      ↳ {factById.get(fid)?.did}
                    </li>
                  ))}
                  {m.factIds.length > 3 && <li>↳ and {m.factIds.length - 3} more</li>}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="card p-5">
            <h2 className="font-medium">Not in your fact bank</h2>
            {missing.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Every requirement has evidence.</p>
            ) : (
              <>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {missing.map((m) => (
                    <li key={m.requirement.name}>
                      <RequirementName requirement={m.requirement} tone="missing" />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  If you really have done one of these, add it as a fact below or in your{" "}
                  <Link href="/app/facts" className="font-medium text-slate-700 underline underline-offset-2">
                    fact bank
                  </Link>
                  . Otherwise leave it out. ProofMyCV will not write it for&nbsp;you.
                </p>
              </>
            )}

            <QuickAddFactCard
              applicationId={application.id}
              experiences={experiences}
              suggestions={missing.map((m) => canonicalTech(m.requirement.name) ?? m.requirement.name).slice(0, 12)}
              onAdded={({ fact, experience, score }) => {
                if (experience) setAddedExperiences((prev) => [...prev, experience]);
                setAddedFacts((prev) => [...prev, fact]);
                return score;
              }}
            />
          </div>

          {application.analysis.problems.length > 0 && (
            <div className="card p-5">
              <h2 className="font-medium">What they want solved</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 [overflow-wrap:anywhere]">
                {application.analysis.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <BulletStudio
        applicationId={application.id}
        experiences={experiences}
        facts={facts}
        bullets={bullets}
        savedBullets={savedBullets}
        onBulletsChange={setBullets}
        onBulletsSaved={(saved) => {
          setBullets(saved);
          setSavedBullets(saved);
        }}
        canGenerate={canGenerate}
      />

      <PdfPreview
        href={pdfHref}
        profile={profile}
        experiences={experiences}
        facts={facts}
        bullets={bullets}
        savedBullets={savedBullets}
        analysis={application.analysis}
        dirty={dirty}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function QuickAddFactCard({
  applicationId,
  experiences,
  suggestions,
  onAdded,
}: {
  applicationId: string;
  experiences: Experience[];
  suggestions: string[];
  onAdded: (payload: { fact: Fact; experience?: Experience; score: number }) => number;
}) {
  const [open, setOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<string>(experiences[0]?.id ?? "__new__");
  const [formKey, setFormKey] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const effectiveSelectedExp =
    selectedExp === "__new__" || experiences.some((e) => e.id === selectedExp)
      ? selectedExp
      : (experiences[0]?.id ?? "__new__");

  const handleSubmit = (fd: FormData) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await quickAddFactAction(applicationId, fd);
      if ("error" in res) {
        setFeedback({ tone: "error", text: res.error });
        return;
      }
      const nextScore = onAdded({ fact: res.fact, experience: res.experience, score: res.score });
      if (res.experience) setSelectedExp(res.experience.id);
      setFormKey((k) => k + 1);
      setOpen(false);
      setFeedback({ tone: "ok", text: `Fact added to your fact bank. Fit score updated to ${nextScore}%.` });
    });
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            setFeedback(null);
          }}
          className="btn btn-sm gap-1.5 text-slate-800"
        >
          {open ? <IconX size={13} /> : <IconPlus size={13} />}
          {open ? "Close" : "Add a fact you really have"}
        </button>
      </div>

      {feedback && (
        <p
          role={feedback.tone === "error" ? "alert" : "status"}
          className={`mt-3 rounded-md px-3 py-2 text-xs font-medium tabular-nums ${
            feedback.tone === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {feedback.text}
        </p>
      )}

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
          <form key={formKey} action={handleSubmit} className="grid gap-3">
            <label className="block">
              <span className="label">Where you did it</span>
              <select
                name="experienceId"
                value={effectiveSelectedExp}
                onChange={(e) => setSelectedExp(e.target.value)}
                required
                className="input"
              >
                {experiences.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                    {e.org ? ` · ${e.org}` : ""}
                  </option>
                ))}
                <option value="__new__">+ New experience or project…</option>
              </select>
            </label>

            {effectiveSelectedExp === "__new__" && (
              <div className="grid gap-3 rounded-lg border border-slate-200/80 bg-white p-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Type</span>
                  <select name="kind" defaultValue="project" className="input">
                    {KIND_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Title</span>
                  <input name="title" required placeholder="e.g. REST API project" className="input" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="label">Organisation (optional)</span>
                  <input name="org" placeholder="Company, team or university" className="input" />
                </label>
              </div>
            )}

            <label className="block">
              <span className="label">What you did</span>
              <textarea
                name="did"
                required
                minLength={3}
                rows={2}
                placeholder="In your own words, only what really happened"
                className="input"
              />
            </label>

            <label className="block">
              <span className="label">Result (with the number, if there is one)</span>
              <input name="result" placeholder="e.g. Cut response time from 420 ms to 95 ms" className="input" />
            </label>

            <TechChips suggestions={suggestions} />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="submit" disabled={pending} className="btn-primary btn-sm min-h-9 px-4">
                {pending ? "Adding…" : "Add fact"}
              </button>
              <button type="button" disabled={pending} onClick={() => setOpen(false)} className="btn btn-sm min-h-9">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function RequirementName({
  requirement: r,
  tone,
}: {
  requirement: { name: string; importance: "required" | "preferred" };
  tone: "ok" | "missing";
}) {
  // A missing skill is a gap, not an error: dashed and neutral, paired with IconMinus so color is never sole cue.
  const colour =
    tone === "ok" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600/15" : "border border-dashed border-slate-300 bg-white text-slate-700";
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-sm [overflow-wrap:anywhere] ${colour}`}>
      {tone === "ok" ? <IconCheck size={13} className="shrink-0 text-emerald-700" /> : <IconMinus size={13} className="shrink-0 text-slate-400" />}
      <span>{r.name}</span>
      {r.importance === "preferred" && <span className="text-xs text-slate-500">nice to have</span>}
    </span>
  );
}
