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

export type BulletDraft = {
  experienceId: string;
  text: string;
  factIds: string[];
};

export const factText = (f: Fact) =>
  [f.did, f.result ?? "", f.tech.join(", ")].filter(Boolean).join(". ");
