// Eval scoring shared by the offline test (CI) and the live runner.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { evalCaseSchema, type EvalCase } from "./schema";
import { checkBullet, extractNumbers, MAX_BULLET_WORDS, type GuardResult } from "@/lib/core/guard";
import { canonicalTech, mentions } from "@/lib/core/vocab";
import { factText, type BulletDraft, type Experience, type Fact, type JobAnalysis } from "@/lib/core/types";

export function loadCases(dir = join(process.cwd(), "eval", "cases")): EvalCase[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => z.array(evalCaseSchema).parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));
}

export const bank = (c: EvalCase): { experiences: Experience[]; facts: Fact[] } => ({
  experiences: c.experiences,
  facts: c.facts,
});

// ---------- guard ----------

export type Fabrication = BulletDraft & { kind: string; source: "hand" | "auto" };

/** A number that appears nowhere in the case's facts, so using it is a fabrication. */
function unusedNumber(c: EvalCase, near: number) {
  const used = new Set(c.facts.flatMap((f) => extractNumbers(factText(f)).map((n) => n.value)));
  for (const n of [Math.round(near * 1.5) || 7, near + 7, 37, 43, 61, 83]) if (!used.has(n)) return n;
  return 97;
}

/**
 * Fabrications generated from each gold bullet, so the guard is tested on
 * mistakes nobody hand-picked: a changed number, an added percentage, an
 * unsupported technology from the posting, an unsupported multiplier, and a
 * claim that cites the wrong fact.
 */
export function autoFabrications(c: EvalCase): Fabrication[] {
  const out: Fabrication[] = [];
  const missingTech = c.missing.map((m) => canonicalTech(m)).filter((m): m is string => Boolean(m));
  for (const g of c.gold) {
    const base = { experienceId: g.experienceId, factIds: g.factIds, source: "auto" as const };
    const first = g.text.match(/(?<![A-Za-z\d.])\d+(?:\.\d+)?/);
    if (first) {
      const n = Number(first[0]);
      out.push({ ...base, kind: "number", text: g.text.replace(first[0], String(unusedNumber(c, n))) });
    }
    out.push({ ...base, kind: "number", text: `${g.text.replace(/\.$/, "")}, cutting costs by ${unusedNumber(c, 20)}%` });
    if (missingTech[0]) out.push({ ...base, kind: "tech", text: `${g.text.replace(/\.$/, "")} using ${missingTech[0]}` });
    out.push({ ...base, kind: "multiplier", text: `${g.text.replace(/\.$/, "")}, doubling team output` });

    // Same text, but citing a fact from another experience: only a fabrication
    // if the text makes a claim that other fact cannot back.
    const other = c.facts.find((f) => f.experienceId !== g.experienceId);
    if (other) {
      const swapped = { ...base, factIds: [other.id], text: g.text };
      if (!checkBullet(swapped, c.facts, c.experiences).ok) out.push({ ...swapped, kind: "citation" });
    }
  }
  return out;
}

export type GuardReport = {
  gold: {
    total: number;
    accepted: number;
    rejected: { caseId: string; text: string; why: string[] }[];
    /** Accepted faithful bullets that still got a counted-noun warning (false warnings). */
    warned: { caseId: string; text: string }[];
  };
  fabricated: {
    total: number;
    blocked: number;
    byKind: Record<string, { total: number; blocked: number }>;
    /** `warned`: let through, but flagged with a counted-noun warning. */
    missed: { caseId: string; kind: string; source: string; text: string; warned: boolean }[];
  };
};

const countedNoun = (r: GuardResult) => r.warnings.some((w) => w.type === "counted-noun");

const reasons = (r: GuardResult) =>
  r.violations.map((v) => ("claim" in v ? `number ${v.claim}` : "term" in v ? `${v.type} ${v.term}` : v.type));

export function evaluateGuard(cases: EvalCase[]): GuardReport {
  const report: GuardReport = {
    gold: { total: 0, accepted: 0, rejected: [], warned: [] },
    fabricated: { total: 0, blocked: 0, byKind: {}, missed: [] },
  };
  for (const c of cases) {
    for (const g of c.gold) {
      report.gold.total++;
      const r = checkBullet(g, c.facts, c.experiences);
      if (r.ok) report.gold.accepted++;
      else report.gold.rejected.push({ caseId: c.id, text: g.text, why: reasons(r) });
      if (r.ok && countedNoun(r)) report.gold.warned.push({ caseId: c.id, text: g.text });
    }
    const fabs: Fabrication[] = [
      ...c.fabricated.map((f) => ({ ...f, source: "hand" as const })),
      ...autoFabrications(c),
    ];
    for (const f of fabs) {
      const k = (report.fabricated.byKind[f.kind] ??= { total: 0, blocked: 0 });
      k.total++;
      report.fabricated.total++;
      const r = checkBullet(f, c.facts, c.experiences);
      if (!r.ok) {
        k.blocked++;
        report.fabricated.blocked++;
      } else {
        report.fabricated.missed.push({ caseId: c.id, kind: f.kind, source: f.source, text: f.text, warned: countedNoun(r) });
      }
    }
  }
  return report;
}

// ---------- extraction ----------

/** Does an extracted requirement name the same skill as a hand label? */
const sameSkill = (label: string, extracted: string) => {
  const a = canonicalTech(label);
  const b = canonicalTech(extracted);
  if (a && b) return a === b;
  return mentions(extracted, label) || mentions(label, extracted);
};

export type ExtractionScore = {
  required: { total: number; found: number };
  all: { total: number; found: number };
  extracted: number;
  matchedExtracted: number;
};

export function scoreExtraction(c: EvalCase, a: JobAnalysis): ExtractionScore {
  const names = a.requirements.map((r) => r.name);
  const labels = [...c.expected.required, ...c.expected.preferred];
  const found = (l: string) => names.some((n) => sameSkill(l, n));
  return {
    required: { total: c.expected.required.length, found: c.expected.required.filter(found).length },
    all: { total: labels.length, found: labels.filter(found).length },
    extracted: names.length,
    matchedExtracted: names.filter((n) => labels.some((l) => sameSkill(l, n))).length,
  };
}

export function sumExtraction(scores: ExtractionScore[]) {
  const s = (f: (x: ExtractionScore) => number) => scores.reduce((t, x) => t + f(x), 0);
  return {
    requiredRecall: s((x) => x.required.found) / s((x) => x.required.total),
    recall: s((x) => x.all.found) / s((x) => x.all.total),
    precision: s((x) => x.matchedExtracted) / Math.max(1, s((x) => x.extracted)),
  };
}

// ---------- drafted bullets ----------

/**
 * Independent fabrication oracle for drafted bullets, built from the case
 * labels rather than from the guard: a bullet leaks bait if it claims a skill
 * the candidate lacks or copies a number that only the job posting contains.
 */
export function baitLeaks(c: EvalCase, text: string): string[] {
  const leaks = c.missing.filter((m) => mentions(text, m));
  const factNumbers = new Set(c.facts.flatMap((f) => extractNumbers(factText(f)).map((n) => n.value)));
  const jdOnly = new Set(extractNumbers(c.jd).map((n) => n.value).filter((v) => !factNumbers.has(v)));
  for (const n of extractNumbers(text)) if (jdOnly.has(n.value)) leaks.push(`JD number ${n.raw}`);
  return leaks;
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export { MAX_BULLET_WORDS };

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
