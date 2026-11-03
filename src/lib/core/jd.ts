// Job description analysis without an LLM. The LLM path (lib/llm) returns the
// same JobAnalysis shape; both go through normaliseAnalysis so skill names are
// canonical and duplicates are merged.

import { canonicalTech, findTechTerms } from "./vocab";
import type { Importance, JobAnalysis, Requirement } from "./types";

const PREFERRED_HEADING =
  /(nice[- ]to[- ]have|preferred|bonus|a plus|is a plus|plus(?:es)?:|good to have|desirable|advantage)/i;
const REQUIRED_HEADING =
  /(requirements?|qualifications?|must[- ]have|what you(?:'ll)? (?:need|bring)|you have|skills)/i;
const RESPONSIBILITY_HEADING =
  /(responsibilit|what you(?:'ll| will) do|the role|your impact|day[- ]to[- ]day|job description)/i;

const isHeading = (line: string) =>
  line.length < 70 && (/:$/.test(line) || /^#+\s/.test(line) || /^[A-Z][A-Za-z' /&-]+$/.test(line));

const cleanLine = (line: string) =>
  line.replace(/^[-*•·●▪◦\d.)\s]+/, "").replace(/\s+/g, " ").trim();

export function extractJobRuleBased(jd: string): JobAnalysis {
  const lines = jd.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const importance = new Map<string, Importance>();
  const problems: string[] = [];
  let section: "required" | "preferred" | "responsibility" | "other" = "other";

  for (const line of lines) {
    if (isHeading(line)) {
      if (PREFERRED_HEADING.test(line)) section = "preferred";
      else if (RESPONSIBILITY_HEADING.test(line)) section = "responsibility";
      else if (REQUIRED_HEADING.test(line)) section = "required";
      else section = "other";
      continue;
    }
    // A single line can still mark itself as optional ("Docker is a plus").
    const lineImportance: Importance =
      section === "preferred" || PREFERRED_HEADING.test(line) ? "preferred" : "required";
    for (const term of findTechTerms(line)) {
      const prev = importance.get(term);
      if (prev !== "required") importance.set(term, lineImportance);
    }
    if (section === "responsibility" && problems.length < 6) {
      const text = cleanLine(line);
      if (text.split(" ").length >= 4) problems.push(text.length > 140 ? `${text.slice(0, 137)}...` : text);
    }
  }

  const titleLine = lines.find((l) => /(engineer|developer|intern|analyst|designer|scientist)/i.test(l));
  return normaliseAnalysis({
    role: titleLine ? cleanLine(titleLine).slice(0, 80) : "",
    company: null,
    requirements: [...importance].map(([name, imp]) => ({ name, kind: "skill", importance: imp })),
    problems,
  });
}

/** Canonicalise names and merge duplicates, keeping the strongest importance. */
export function normaliseAnalysis(a: JobAnalysis): JobAnalysis {
  const merged = new Map<string, Requirement>();
  for (const r of a.requirements) {
    const name = canonicalTech(r.name) ?? r.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const prev = merged.get(key);
    const kind = canonicalTech(name) ? "skill" : r.kind;
    if (!prev) merged.set(key, { name, kind, importance: r.importance });
    else if (r.importance === "required") prev.importance = "required";
  }
  return {
    role: a.role.trim(),
    company: a.company?.trim() || null,
    requirements: [...merged.values()],
    problems: a.problems.map((p) => p.trim()).filter(Boolean),
  };
}
