// Shared domain shapes. These are plain data so the core logic can run in
// tests, the eval script and the app without touching the database.

export type ExperienceKind = "job" | "project" | "education" | "activity";

export type Experience = {
  id: string;
  kind: ExperienceKind;
  title: string;
  org: string;
  location?: string | null;
  startDate?: string | null; // "2025-06"
  endDate?: string | null; // null = present
};

export type Fact = {
  id: string;
  experienceId: string;
  /** What the user did, in their own words. */
  did: string;
  /** Outcome, ideally with the number that measures it. */
  result?: string | null;
  /** Technologies used, as typed by the user. */
  tech: string[];
};

const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
// "MorPlan - AI trip planner" and "MorPlan (Next.js)" name the same project as "MorPlan".
const entryName = (title: string) => squash(title.split(/\s[-\u2013\u2014|:]\s|\s?[(:|\u2013\u2014]/)[0]);

/** Whether an imported entry is already in the fact bank, so the import starts it unticked. */
export function sameEntry(a: { kind: ExperienceKind; title: string; org: string }, b: { kind: ExperienceKind; title: string; org: string }): boolean {
  if (a.kind !== b.kind) return false;
  // Degree titles are worded many ways ("B.S." vs "Bachelor of Science"); the school decides.
  if (a.kind === "education" && squash(a.org)) return squash(a.org) === squash(b.org);
  const name = entryName(a.title);
  if (!name || name !== entryName(b.title)) return false;
  return a.kind === "project" || squash(a.org) === squash(b.org);
}

export type Importance = "required" | "preferred";

export type Requirement = {
  name: string;
  kind: "skill" | "keyword";
  importance: Importance;
};

export type JobAnalysis = {
  role: string;
  company?: string | null;
  requirements: Requirement[];
  /** Problems the employer wants solved, in short phrases. */
  problems: string[];
};

/** Where an application stands; one value per application. */
export const APPLICATION_STATUSES = ["draft", "ready", "applied", "interviewing", "offer", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export type BulletDraft = {
  experienceId: string;
  text: string;
  factIds: string[];
};

export const factText = (f: Fact) =>
  [f.did, f.result ?? "", f.tech.join(", ")].filter(Boolean).join(". ");
