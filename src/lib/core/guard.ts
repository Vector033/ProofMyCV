// Fabrication guard. Every number and every technology name in a generated
// bullet must be traceable to the facts the bullet cites. This is plain code on
// purpose: the LLM is asked to cite its facts, but we never take its word for it.

import { findTechTerms, withImplied } from "./vocab";
import { factText, type BulletDraft, type Fact } from "./types";

export type NumberClaim = { raw: string; value: number; unit: "percent" | "times" | "plain" };

export type Violation =
  | { type: "no-citation" }
  | { type: "unknown-fact"; factId: string }
  | { type: "number"; claim: string }
  | { type: "tech"; term: string }
  | { type: "term"; term: string };

export type Warning = { type: "too-long"; words: number } | { type: "weak-start"; word: string };

export type GuardResult = {
  ok: boolean;
  violations: Violation[];
  warnings: Warning[];
};

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50, hundred: 100,
  dozen: 12, single: 1,
};
// Words that make a quantitative claim without a digit.
const MULTIPLIER_WORDS: Record<string, number> = {
  double: 2, doubled: 2, doubling: 2, twice: 2, triple: 3, tripled: 3, tripling: 3,
  quadrupled: 4, halved: 2, halving: 2,
};

const SCALE: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

// Digits not glued to letters on the left (so "S3", "EC2", "Web3" are names, not
// numbers), with optional thousands separators, decimals, a k/M/B scale and a unit.
const NUMBER_RE =
  /(?<![A-Za-z\d.])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s?([kKmMbB](?![a-zA-Z]))?\s?(%|percent\b|x\b|×|times\b)?/g;

export function extractNumbers(text: string): NumberClaim[] {
  const claims: NumberClaim[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const [raw, int, frac, scale, unitRaw] = m;
    let value = Number(int.replace(/,/g, "") + (frac ? `.${frac}` : ""));
    if (scale) value *= SCALE[scale.toLowerCase()];
    const unit = !unitRaw
      ? "plain"
      : unitRaw === "%" || unitRaw.startsWith("percent")
        ? "percent"
        : "times";
    claims.push({ raw: raw.trim(), value, unit });
  }
  for (const m of text.toLowerCase().matchAll(/\b[a-z]+\b/g)) {
    const w = m[0];
    if (w in WORD_NUMBERS) claims.push({ raw: w, value: WORD_NUMBERS[w], unit: "plain" });
    else if (w in MULTIPLIER_WORDS) claims.push({ raw: w, value: MULTIPLIER_WORDS[w], unit: "times" });
  }
  return claims;
}

const sameClaim = (a: NumberClaim, b: NumberClaim) =>
  Math.abs(a.value - b.value) < 1e-9 &&
  // "3" in a fact can back "three" or "3x" style wording only when the units agree;
  // a fact's "30 ms" never backs a bullet's "30%".
  (a.unit === b.unit || (a.unit === "plain" && b.unit === "plain"));

// Tokens that look like a product or technology name: inner capitals
// ("GraphQL"), digits mixed with letters ("EC2"), dots or symbols ("Socket.io",
// "C#"), or all-caps acronyms ("SQS").
const TECHY_TOKEN_RE = /(?<![\w.])(?:[A-Za-z]*[a-z][A-Z][A-Za-z]*|[A-Z][A-Z0-9]{1,}s?|[A-Za-z]+\d+[A-Za-z\d]*|[A-Za-z]+(?:\.[A-Za-z]+)+|[A-Za-z]+[#+]+)(?![\w])/g;

// Acronyms that describe work in general rather than claim a specific tool.
const GENERIC_ACRONYMS = new Set([
  "API", "APIs", "UI", "UX", "MVP", "KPI", "KPIs", "OKR", "OKRs", "PR", "PRs", "ID", "IDs",
  "IT", "QA", "HR", "CEO", "CTO", "B2B", "B2C", "FAQ", "PDF", "PDFs", "CSV", "JSON", "URL",
  "URLs", "CRUD", "MVPs", "TA", "GPA", "US", "UK", "EU",
]);

const WEAK_STARTS = new Set(["responsible", "helped", "worked", "assisted", "participated", "involved", "tasked"]);

export const MAX_BULLET_WORDS = 32;

export function checkBullet(bullet: BulletDraft, facts: Fact[]): GuardResult {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];
  const byId = new Map(facts.map((f) => [f.id, f]));

  if (bullet.factIds.length === 0) violations.push({ type: "no-citation" });
  const cited: Fact[] = [];
  for (const id of bullet.factIds) {
    const f = byId.get(id);
    if (f) cited.push(f);
    else violations.push({ type: "unknown-fact", factId: id });
  }

  const evidence = cited.map(factText).join("\n");
  const evidenceNumbers = extractNumbers(evidence);
  const seen = new Set<string>();
  for (const claim of extractNumbers(bullet.text)) {
    if (seen.has(claim.raw)) continue;
    seen.add(claim.raw);
    if (!evidenceNumbers.some((e) => sameClaim(claim, e))) {
      violations.push({ type: "number", claim: claim.raw });
    }
  }

  // A fact naming Jest also backs "automated testing" in the bullet.
  const evidenceTech = withImplied(findTechTerms(evidence));
  const bulletTech = findTechTerms(bullet.text);
  for (const term of bulletTech) {
    if (!evidenceTech.has(term)) violations.push({ type: "tech", term });
  }

  const evidenceLower = evidence.toLowerCase();
  for (const m of bullet.text.matchAll(TECHY_TOKEN_RE)) {
    const token = m[0];
    if (GENERIC_ACRONYMS.has(token)) continue;
    // Already judged by the vocabulary check above.
    if (findTechTerms(token).length > 0) continue;
    if (!evidenceLower.includes(token.toLowerCase())) violations.push({ type: "term", term: token });
  }

  const words = bullet.text.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_BULLET_WORDS) warnings.push({ type: "too-long", words: words.length });
  const first = words[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (WEAK_STARTS.has(first)) warnings.push({ type: "weak-start", word: words[0] });

  return { ok: violations.length === 0, violations, warnings };
}

export function describeViolation(v: Violation): string {
  switch (v.type) {
    case "no-citation":
      return "Cites no fact";
    case "unknown-fact":
      return `Cites a fact that does not exist (${v.factId})`;
    case "number":
      return `Number "${v.claim}" is not in the cited facts`;
    case "tech":
      return `Technology "${v.term}" is not in the cited facts`;
    case "term":
      return `Name "${v.term}" is not in the cited facts`;
  }
}
