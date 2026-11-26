import type { ExperienceKind, Fact, JobAnalysis } from "./types";
import { mentions, normalizeTag } from "./vocab";

export const RESUME_SECTIONS: { kind: ExperienceKind; title: string }[] = [
  { kind: "job", title: "Experience" },
  { kind: "project", title: "Projects" },
  { kind: "education", title: "Education" },
  { kind: "activity", title: "Activities" },
];

export function orderedResumeSections(educationFirst: boolean) {
  return educationFirst
    ? [...RESUME_SECTIONS.filter((x) => x.kind === "education"), ...RESUME_SECTIONS.filter((x) => x.kind !== "education")]
    : RESUME_SECTIONS;
}

export function parseProfileLinks(links: string): string[] {
  return links
    .split(/\s*[·|,]\s*/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Skills from the fact bank, with the ones the job asks for first. */
export function orderedSkills(facts: Fact[], analysis: JobAnalysis) {
  const seen = new Set<string>();
  const all = facts
    .flatMap((f) => f.tech.flatMap(normalizeTag))
    .filter((t) => !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
  const rank = (t: string) => {
    const i = analysis.requirements.findIndex((r) => mentions(t, r.name));
    if (i === -1) return 1000;
    return (analysis.requirements[i].importance === "required" ? 0 : 100) + i;
  };
  return all.sort((a, b) => rank(a) - rank(b)).slice(0, 24);
}
