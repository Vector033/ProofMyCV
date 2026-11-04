// Mapping between job requirements and the fact bank, and the fit score.

import { mentions } from "./vocab";
import { factText, type Experience, type Fact, type JobAnalysis, type Requirement } from "./types";

export type RequirementMatch = {
  requirement: Requirement;
  factIds: string[];
};

export type FitReport = {
  matches: RequirementMatch[];
  /** 0-100, weighted by importance. */
  score: number;
  covered: number;
  total: number;
};

export const WEIGHTS = { required: 3, preferred: 1 } as const;

/**
 * A fact backs a requirement through its own text or tags, or through the
 * experience it belongs to ("B.Sc. Computer Science" backs "Computer Science").
 */
export function matchRequirements(analysis: JobAnalysis, facts: Fact[], experiences: Experience[] = []): FitReport {
  const context = new Map(experiences.map((e) => [e.id, `${e.title}. ${e.org}`]));
  const evidence = new Map(facts.map((f) => [f.id, `${factText(f)}\n${context.get(f.experienceId) ?? ""}`]));
  const matches = analysis.requirements.map((requirement) => ({
    requirement,
    factIds: facts.filter((f) => mentions(evidence.get(f.id)!, requirement.name)).map((f) => f.id),
  }));
  let got = 0;
  let max = 0;
  for (const m of matches) {
    const w = WEIGHTS[m.requirement.importance];
    max += w;
    if (m.factIds.length > 0) got += w;
  }
  const covered = matches.filter((m) => m.factIds.length > 0).length;
  return {
    matches,
    score: max === 0 ? 0 : Math.round((got / max) * 100),
    covered,
    total: matches.length,
  };
}
