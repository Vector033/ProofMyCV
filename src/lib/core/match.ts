// Mapping between job requirements and the fact bank, and the fit score.

import { canonicalTech, contentWords, findTechTerms, mentions, withImplied } from "./vocab";
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

// Matching only, never the guard: broader requirement words that a fact's tools prove.
// A FastAPI fact backs "Backend APIs"; a Gemini fact backs "AI".
const BROADER: [string[], string][] = [
  [["FastAPI", "Express", "Django", "Flask", "Node.js", "REST", "GraphQL"], "backend api rest restful software development"],
  [["Next.js", "React", "Vue", "Angular", "Svelte"], "frontend web application software development"],
  [["Gemini", "OpenAI", "LLM"], "ai artificial intelligence llm"],
  [["PostgreSQL", "MySQL", "SQLite", "Supabase"], "rdbms relational database sql data persistence"],
  [["Firestore", "Firebase", "MongoDB", "Redis"], "nosql database data persistence"],
];
// Matching only: a tool proves the wider skill a posting names (Next.js is React; TypeScript is JavaScript).
const PROVES: Record<string, string[]> = {
  React: ["Next.js"],
  JavaScript: ["TypeScript", "Node.js", "React", "Next.js", "Vue", "Angular", "Svelte"],
  REST: ["FastAPI", "Express", "Django", "Flask", "NestJS"],
};
// "Fluent in Thai" is a language, not a topic: "Thai slip reading" is no evidence of it.
const LANGUAGE_RE =
  /^(?:fluent (?:in )?|native |business |proficien\w* in )?(thai|english|japanese|chinese|mandarin|korean|french|german|spanish|vietnamese)(?: language| (?:speaking|writing|communication|proficiency|skills?))?$/i;
const SPOKEN = "native|fluent|fluency|proficien\\w*|speak\\w*|spoken|written|language|toeic|ielts|toefl|cefr|jlpt|hsk";
// Words that only say what kind of thing it is ("AI systems", "data tools").
const GENERIC = new Set(["system", "solution", "tool", "technologi", "technology", "framework", "platform"]);

/**
 * Does a fact back a requirement? Exact vocabulary and word matches first; then the
 * broader words its tools prove, and any one part of a compound like "AI/RAG/OCR systems".
 */
export function backs(text: string, requirement: string): boolean {
  const lang = requirement.trim().match(LANGUAGE_RE)?.[1];
  if (lang) return new RegExp(`\\b(${SPOKEN})\\W+(\\w+\\W+){0,3}${lang}\\b|\\b${lang}\\W+(\\w+\\W+){0,2}(${SPOKEN})\\b`, "i").test(text);
  if (mentions(text, requirement)) return true;
  const tech = findTechTerms(text);
  const proven = withImplied(tech);
  const extra = BROADER.filter(([names]) => names.some((n) => tech.includes(n))).map(([, words]) => words);
  if (/\btesseract/i.test(text)) extra.push("ocr");
  const have = new Set(contentWords(`${text} ${extra.join(" ")}`));
  // "Java / C# / Python": any one option backs it.
  const parts = requirement.includes("/") && !canonicalTech(requirement) ? requirement.split("/").map((p) => p.trim()) : [requirement];
  return parts.some((p) => {
    const name = canonicalTech(p);
    if (name) return mentions(text, p) || (PROVES[name] ?? []).some((n) => proven.has(n));
    const needed = contentWords(p).filter((w) => !GENERIC.has(w));
    return needed.length > 0 && needed.every((w) => have.has(w));
  });
}

/**
 * A fact backs a requirement through its own text or tags, or through the
 * experience it belongs to ("B.Sc. Computer Science" backs "Computer Science").
 */
export function matchRequirements(analysis: JobAnalysis, facts: Fact[], experiences: Experience[] = []): FitReport {
  const context = new Map(experiences.map((e) => [e.id, `${e.title}. ${e.org}`]));
  const evidence = new Map(facts.map((f) => [f.id, `${factText(f)}\n${context.get(f.experienceId) ?? ""}`]));
  const matches = analysis.requirements.map((requirement) => ({
    requirement,
    factIds: facts.filter((f) => backs(evidence.get(f.id)!, requirement.name)).map((f) => f.id),
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
