"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkBullet } from "@/lib/core/guard";
import { orderedResumeSections, orderedSkills, parseProfileLinks } from "@/lib/core/resume-layout";
import type { BulletDraft, Experience, Fact, JobAnalysis } from "@/lib/core/types";
import { formatRange } from "@/lib/format";
import { IconAlert, IconDownload } from "@/components/icons";

type Props = {
  href: string;
  profile: { fullName: string; headline: string; contact: string; links: string };
  experiences: Experience[];
  facts: Fact[];
  bullets: BulletDraft[];
  savedBullets: BulletDraft[];
  analysis: JobAnalysis;
  dirty: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function sameFactIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/**
 * Light-themed .paper-texture inline resume sheet preview rendered directly from the
 * application's header, ordered bullets (live with "Education first"), and unsaved indicators.
 */
export function PdfPreview({
  href,
  profile,
  experiences,
  facts,
  bullets,
  savedBullets,
  analysis,
  dirty,
  open,
  onOpenChange,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [educationFirst, setEducationFirst] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const pdfSrc = educationFirst ? `${href}?education=first` : href;
  const sections = useMemo(() => orderedResumeSections(educationFirst), [educationFirst]);
  const skills = useMemo(() => orderedSkills(facts, analysis), [facts, analysis]);
  const links = useMemo(() => parseProfileLinks(profile.links), [profile.links]);

  const hasAnySection = sections.some(({ kind }) =>
    experiences.some((e) => e.kind === kind && (kind === "education" || bullets.some((b) => b.experienceId === e.id))),
  );

  return (
    <dialog
      ref={dialog}
      aria-label="Resume preview"
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === dialog.current) onOpenChange(false);
      }}
      className="m-auto h-[min(92vh,1080px)] w-[min(60rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-slate-50 p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/45 sm:w-[min(60rem,calc(100vw-2rem))]"
    >
      <div className="flex h-full flex-col">
        <div className="fluted-glass flex flex-wrap items-center gap-2.5 border-b border-slate-200/90 px-4 py-3 sm:px-5">
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <h2 className="font-medium text-slate-900">Resume preview</h2>
            {dirty && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                <IconAlert size={12} className="text-amber-700" />
                Unsaved edits shown
              </span>
            )}
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700 md:min-h-8">
            <input
              type="checkbox"
              checked={educationFirst}
              onChange={(e) => setEducationFirst(e.target.checked)}
              className="size-4 accent-slate-900"
            />
            Education first
          </label>
          <a href={pdfSrc} target="_blank" rel="noreferrer" className="btn">
            Open PDF
          </a>
          <a href={pdfSrc} download className="btn-primary">
            <IconDownload size={15} />
            Export PDF
          </a>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>

        {dirty && (
          <div className="border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 text-xs text-amber-950 sm:px-5">
            Highlighted bullets have unsaved edits. Save version in Bullet Studio so they are included when you export the PDF.
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-slate-100/80 p-3 sm:p-8">
          <article className="relative isolate mx-auto w-full max-w-[46rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-xs">
            <span aria-hidden="true" className="paper-texture absolute inset-0 rounded-[inherit]" />
            <div className="relative z-10 px-6 py-7 text-slate-900 sm:px-11 sm:py-10">
              {/* Resume Header */}
              <header className="border-b border-slate-200/80 pb-4">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{profile.fullName || "Your Name"}</h3>
                {profile.headline && <p className="mt-0.5 text-sm text-slate-700">{profile.headline}</p>}
                {(profile.contact || links.length > 0) && (
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-600 sm:text-[13px]">
                    {profile.contact && <span>{profile.contact}</span>}
                    {links.map((l, i) => (
                      <span key={l} className="inline-flex items-center gap-1.5">
                        {(profile.contact || i > 0) && <span aria-hidden>·</span>}
                        <a
                          href={l.startsWith("http") ? l : `https://${l}`}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-slate-300 underline-offset-2 hover:text-slate-900 hover:decoration-slate-500"
                        >
                          {l}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </header>

              {/* Experience / Projects / Education / Activities Sections */}
              <div className="mt-5 space-y-5 text-[13px] leading-relaxed">
                {!hasAnySection && (
                  <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center text-sm text-slate-600">
                    No bullets added to this resume version yet. Add bullets in Bullet Studio to preview them here.
                  </p>
                )}

                {sections.map(({ kind, title }) => {
                  const entries = experiences.filter(
                    (e) => e.kind === kind && (kind === "education" || bullets.some((b) => b.experienceId === e.id)),
                  );
                  if (entries.length === 0) return null;
                  return (
                    <section key={kind}>
                      <h4 className="border-b border-slate-300 pb-1 text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                        {title}
                      </h4>
                      <div className="mt-2.5 space-y-3.5">
                        {entries.map((e) => {
                          const expBullets = bullets.filter((b) => b.experienceId === e.id);
                          const savedExpBullets = savedBullets.filter((b) => b.experienceId === e.id);
                          const range = formatRange(e);
                          return (
                            <div key={e.id}>
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                <p className="text-slate-900 [overflow-wrap:anywhere]">
                                  <span className="font-semibold">{e.title}</span>
                                  {e.org && <span className="text-slate-700">, {e.org}</span>}
                                </p>
                                {range && <span className="shrink-0 text-xs text-slate-600 tabular-nums">{range}</span>}
                              </div>
                              {e.location && <p className="text-xs text-slate-600">{e.location}</p>}
                              {expBullets.length > 0 && (
                                <ul className="mt-1.5 space-y-1.5">
                                  {expBullets.map((b, idx) => {
                                    const check = checkBullet(b, facts, experiences);
                                    const exactSameSpot =
                                      savedExpBullets[idx] !== undefined &&
                                      savedExpBullets[idx].text === b.text &&
                                      sameFactIds(savedExpBullets[idx].factIds, b.factIds);
                                    const existsInSaved = savedExpBullets.some(
                                      (s) => s.text === b.text && sameFactIds(s.factIds, b.factIds),
                                    );
                                    const editState = !check.ok
                                      ? "blocked"
                                      : !existsInSaved
                                        ? "edited"
                                        : !exactSameSpot
                                          ? "moved"
                                          : "saved";

                                    const rowStyle =
                                      editState === "blocked"
                                        ? "rounded-md border-l-2 border-red-600 bg-red-50/80 px-2 py-1 -mx-2"
                                        : editState === "edited"
                                          ? "rounded-md border-l-2 border-amber-500 bg-amber-50/80 px-2 py-1 -mx-2"
                                          : editState === "moved"
                                            ? "rounded-md border-l-2 border-amber-400 bg-amber-50/50 px-2 py-1 -mx-2"
                                            : "";

                                    return (
                                      <li key={`${idx}-${b.text.slice(0, 16)}`} className={`flex items-start gap-2 ${rowStyle}`}>
                                        <span aria-hidden className="mt-0.5 select-none text-slate-500">
                                          •
                                        </span>
                                        <span className="min-w-0 flex-1 text-slate-800 [overflow-wrap:anywhere]">{b.text}</span>
                                        {editState === "blocked" && (
                                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
                                            <IconAlert size={11} /> Blocked
                                          </span>
                                        )}
                                        {editState === "edited" && (
                                          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                                            Unsaved
                                          </span>
                                        )}
                                        {editState === "moved" && (
                                          <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                                            Reordered
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}

                {skills.length > 0 && (
                  <section>
                    <h4 className="border-b border-slate-300 pb-1 text-[11px] font-bold tracking-wider text-slate-800 uppercase">
                      Skills
                    </h4>
                    <p className="mt-2 text-slate-800">{skills.join(", ")}</p>
                  </section>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </dialog>
  );
}
