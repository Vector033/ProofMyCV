// Mapping between job requirements and the fact bank, and the fit score.

import { mentions } from "./vocab";
import { factText, type Fact, type JobAnalysis, type Requirement } from "./types";

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

const factMentions = (f: Fact, requirement: string) =>
  f.tech.some((t) => mentions(t, requirement)) || mentions(factText(f), requirement);

export function matchRequirements(analysis: JobAnalysis, facts: Fact[]): FitReport {
  const matches = analysis.requirements.map((requirement) => ({
    requirement,
    factIds: facts.filter((f) => factMentions(f, requirement.name)).map((f) => f.id),
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
