// Writing-quality checks for drafted bullets, measurable without a judge model.
// They approximate Google's XYZ shape: a strong verb, the measured result when
// the facts have one, and how it was done, without padding.

import { extractNumbers } from "@/lib/core/guard";
import { factText, type Fact } from "@/lib/core/types";
import { wordCount } from "./metrics";

const IRREGULAR_PAST = new Set(
  "built wrote led ran made cut grew won set rebuilt rewrote drew gave held kept sold taught brought caught found fought chose shipped".split(" "),
);
const WEAK = new Set(["responsible", "helped", "worked", "assisted", "participated", "involved", "tasked", "was", "did"]);

export type StyleCheck = {
  strongVerb: boolean;
  /** Cited facts contain a number and the bullet uses one. Null when the facts have none. */
  usesMetric: boolean | null;
  /** Has an explicit "by …ing" / "through …" clause (informational; humans often say "how" with "with React"). */
  hasHow: boolean;
  /** Ends with a bare list of tools: "…using Java, Spring Boot, and PostgreSQL." */
  toolTail: boolean;
  /** Repeats a cited fact's "did" sentence word for word. */
  copiesFact: boolean;
  words: number;
};

export function checkStyle(text: string, cited: Fact[]): StyleCheck {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  const strongVerb = !WEAK.has(first) && (/ed$/.test(first) || IRREGULAR_PAST.has(first));

  const factHasNumber = cited.some((f) => extractNumbers(factText(f)).some((n) => !/^[a-z]+$/.test(n.raw)));
  const usesMetric = factHasNumber ? extractNumbers(text).some((n) => !/^[a-z]+$/.test(n.raw)) : null;

  const hasHow = /\bby\s+[a-z]+ing\b|\bthrough\b|\busing\b[^,.]*\bto\b|\bwith\b[^,.]*\bto\b/i.test(text);

  const tailMatch = text.replace(/\.$/, "").match(/\b(?:using|utilizing|leveraging|with|via)\s+([^.;]+)$/i);
  const parts = tailMatch?.[1].split(/,\s*(?:and\s+)?|\s+and\s+/).filter(Boolean) ?? [];
  const toolTail = parts.length >= 2 && parts.every((p) => wordCount(p) <= 3);

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const copiesFact = cited.some((f) => norm(f.did).length > 20 && norm(text).includes(norm(f.did)));

  return { strongVerb, usesMetric, hasHow, toolTail, copiesFact, words: wordCount(text) };
}

export function summariseStyle(checks: StyleCheck[]) {
  const n = Math.max(1, checks.length);
  const withMetric = checks.filter((c) => c.usesMetric !== null);
  // Rewritten in XYZ style: leads with a strong verb, keeps the measured result
  // when there is one, is not a copy of the fact, and does not end in a tool list.
  const xyz = checks.filter((c) => c.strongVerb && c.usesMetric !== false && !c.toolTail && !c.copiesFact);
  return {
    bullets: checks.length,
    strongVerb: checks.filter((c) => c.strongVerb).length / n,
    usesMetric: withMetric.filter((c) => c.usesMetric).length / Math.max(1, withMetric.length),
    hasHow: checks.filter((c) => c.hasHow).length / n,
    toolTail: checks.filter((c) => c.toolTail).length / n,
    copiesFact: checks.filter((c) => c.copiesFact).length / n,
    xyzShape: xyz.length / n,
    meanWords: checks.reduce((t, c) => t + c.words, 0) / n,
  };
}
