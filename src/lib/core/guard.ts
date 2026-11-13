// Fabrication guard. Every number and every technology name in a generated
// bullet must be traceable to the facts the bullet cites. This is plain code on
// purpose: the LLM is asked to cite its facts, but we never take its word for it.

import { abbreviationBacked, contentWords, findTechTerms, withImplied } from "./vocab";
import { factText, type BulletDraft, type Experience, type Fact } from "./types";

/**
 * A quantity. `unit` is "percent", "times", "plain" (no unit) or a measurement
 * unit such as "ms", "week", "MB", "USD".
 */
export type NumberClaim = { raw: string; value: number; unit: string };

export type Violation =
  | { type: "no-citation" }
  | { type: "unknown-fact"; factId: string }
  | { type: "number"; claim: string }
  | { type: "tech"; term: string }
  | { type: "term"; term: string };

export type Warning =
  | { type: "too-long"; words: number }
  | { type: "weak-start"; word: string }
  /** Same number as the fact, but it seems to count something else ("120 bookings" vs "120 members"). */
  | { type: "counted-noun"; claim: string; fact: string };

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

// Measurement units, longest spelling first, mapped to one canonical name.
const UNITS: [RegExp, string][] = [
  [/^(?:milliseconds?|msecs?|ms)$/i, "ms"],
  [/^(?:seconds?|secs?|s)$/i, "s"],
  [/^(?:minutes?|mins?)$/i, "min"],
  [/^(?:hours?|hrs?|h)$/i, "h"],
  [/^days?$/i, "day"],
  [/^weeks?$/i, "week"],
  [/^months?$/i, "month"],
  [/^(?:years?|yrs?)$/i, "year"],
  [/^(?:kb|kilobytes?)$/i, "KB"],
  [/^(?:mb|megabytes?)$/i, "MB"],
  [/^(?:gb|gigabytes?)$/i, "GB"],
  [/^(?:tb|terabytes?)$/i, "TB"],
  [/^mah$/i, "mAh"],
  [/^(?:usd|dollars?)$/i, "USD"],
  [/^(?:thb|baht)$/i, "THB"],
  [/^(?:fps)$/i, "fps"],
];
const UNIT_WORDS =
  "milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|hours?|hrs?|h|days?|weeks?|months?|years?|yrs?|kb|kilobytes?|mb|megabytes?|gb|gigabytes?|tb|terabytes?|mah|usd|dollars?|thb|baht|fps";

// Digits not glued to letters on the left (so "S3", "EC2", "Web3" are names, not
// numbers), with optional thousands separators, decimals, a k/M/B scale, then
// either a ratio unit (%, x) or a measurement unit ("410 ms", "3-week").
const NUMBER_RE = new RegExp(
  String.raw`(\$)?(?<![A-Za-z\d.])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s?([kKmMbB])(?![a-zA-Z]))?` +
    String.raw`(?:\s?(%|percent\b|x\b|×|times\b)|[\s-]?(${UNIT_WORDS})\b)?`,
  "gi",
);

const canonicalUnit = (u: string) => UNITS.find(([re]) => re.test(u))?.[1] ?? "plain";

export function extractNumbers(text: string): NumberClaim[] {
  const claims: NumberClaim[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const [raw, dollar, int, frac, scale, ratio, measure] = m;
    let value = Number(int.replace(/,/g, "") + (frac ? `.${frac}` : ""));
    // A scale letter never touches another letter, so "380 MB" reads as a unit.
    if (scale) value *= SCALE[scale.toLowerCase()];
    const unit = ratio
      ? ratio === "%" || ratio.toLowerCase().startsWith("percent")
        ? "percent"
        : "times"
      : dollar
        ? "USD"
        : measure
          ? canonicalUnit(measure)
          : "plain";
    claims.push({ raw: raw.trim(), value, unit });
  }
  // Number and multiplier words. Hyphenated compounds ("double-charge",
  // "single-page") are adjectives, not quantities.
  for (const m of text.toLowerCase().matchAll(/(?<![a-z-])[a-z]+(?![a-z-])/g)) {
    const w = m[0];
    if (w in WORD_NUMBERS) claims.push({ raw: w, value: WORD_NUMBERS[w], unit: "plain" });
    else if (w in MULTIPLIER_WORDS) claims.push({ raw: w, value: MULTIPLIER_WORDS[w], unit: "times" });
  }
  return claims;
}

const RATIOS = new Set(["percent", "times"]);

/**
 * Same value and compatible units. Percent and multipliers must match exactly
 * (a fact's "30 ms" never backs "30%"). Two different measurement units never
 * match ("2 days" does not back "2 weeks"), but a bare number can pair with a
 * measured one, as in "from 410 to 260 KB".
 */
const sameClaim = (a: NumberClaim, b: NumberClaim) =>
  Math.abs(a.value - b.value) < 1e-9 &&
  (a.unit === b.unit ||
    (a.unit === "plain" && !RATIOS.has(b.unit)) ||
    (b.unit === "plain" && !RATIOS.has(a.unit)));

// Units that convert to one base, so "12 min to 40 s" can back "94% faster".
const BASE_UNIT: Record<string, [family: string, factor: number]> = {
  ms: ["time", 1e-3], s: ["time", 1], min: ["time", 60], h: ["time", 3600], day: ["time", 86400], week: ["time", 604800],
  KB: ["size", 1], MB: ["size", 1e3], GB: ["size", 1e6], TB: ["size", 1e9],
};

/** Both values in one unit, or null when they measure different things. */
function comparable(a: NumberClaim, b: NumberClaim): [number, number] | null {
  if (a.unit === b.unit && a.unit !== "times") return [a.value, b.value];
  if (a.unit === "plain" && !RATIOS.has(b.unit)) return [a.value, b.value];
  if (b.unit === "plain" && !RATIOS.has(a.unit)) return [a.value, b.value];
  const [fa, fb] = [BASE_UNIT[a.unit], BASE_UNIT[b.unit]];
  return fa && fb && fa[0] === fb[0] ? [a.value * fa[1], b.value * fb[1]] : null;
}

// What may sit between two numbers that form a before/after or part/whole pair:
// "from 410 to 260 KB", "78 of 100", "92/100", "0.62 -> 0.81".
const PAIR_GAP = /^\s*(?:to|of|out of|down to|up to|vs\.?|versus|\/|->|→)\s*$/i;

/**
 * Percentages and multipliers a fact's own numbers support: the change from one
 * number to the next ("410 to 260 KB" -> 36.6%), a part of a whole ("78 of
 * 100" -> 78%), a ratio ("12 min to 3 min" -> 4x) and a decimal score ("0.91" -> 91%).
 * Only neighbours joined by "to", "of" or "/" pair up, so "340 tickets over 8
 * months" never yields "98%".
 */
function derivedValues(fact: string): { percent: number[]; times: number[] } {
  // Digits only: "one", "single" and friends are not measurements.
  const nums = extractNumbers(fact).filter((n) => /^[$\d]/.test(n.raw));
  const percent: number[] = [];
  const times: number[] = [];
  for (const n of nums) if (n.unit === "plain" && n.value > 0 && n.value < 1) percent.push(n.value * 100);
  let at = 0;
  const ends: [number, number][] = nums.map((n) => {
    const i = fact.indexOf(n.raw, at);
    at = i + n.raw.length;
    return [i, at];
  });
  for (let i = 0; i + 1 < nums.length; i++) {
    if (!PAIR_GAP.test(fact.slice(ends[i][1], ends[i + 1][0]))) continue;
    const pair = comparable(nums[i], nums[i + 1]);
    if (!pair) continue;
    const [a, b] = pair;
    if (a <= 0 || b <= 0 || a === b) continue;
    percent.push((Math.abs(b - a) / a) * 100, (Math.min(a, b) / Math.max(a, b)) * 100);
    times.push(Math.max(a, b) / Math.min(a, b));
  }
  return { percent, times };
}

/** Content words within 4 words of the claim, not crossing a comma or bracket. */
function claimContext(text: string, raw: string): string[] {
  const i = text.toLowerCase().indexOf(raw.toLowerCase());
  if (i < 0) return [];
  const before = text.slice(0, i).split(/[,;()]/).at(-1)!.trim().split(/\s+/).slice(-4).join(" ");
  const after = text.slice(i + raw.length).split(/[,;()]/)[0].trim().split(/\s+/).slice(0, 4).join(" ");
  return contentWords(`${before} ${after}`).filter((w) => /^[a-z]/.test(w));
}

/**
 * A percent or multiplier the cited facts compute, within rounding, about
 * something that fact mentions: "cut page weight by 37%" from "page weight went
 * from 410 KB to 260 KB", but not "cutting costs by 30%" from a hit rate that
 * rose 30%. A percent may be rounded either way ("36%" or "37%" for 36.6%); a
 * multiplier must be within 5% ("4x" needs 3.8 to 4.2), so "halved" never
 * covers 410 -> 260.
 */
function derivable(claim: NumberClaim, text: string, facts: string[]): boolean {
  if (!RATIOS.has(claim.unit)) return false;
  const step = 10 ** -(claim.raw.match(/\.(\d+)/)?.[1].length ?? 0);
  const context = claimContext(text, claim.raw);
  return facts.some((f) => {
    const d = derivedValues(f);
    const close =
      claim.unit === "percent"
        ? d.percent.some((v) => Math.abs(v - claim.value) < step)
        : d.times.some((v) => Math.abs(v - claim.value) <= Math.min(step / 2, 0.05 * claim.value));
    if (!close) return false;
    const factWords = new Set(contentWords(f));
    return context.some((w) => factWords.has(w));
  });
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A number followed by one of these counts nothing itself: "from 15 to 4", "Vue 3 with Vite".
const FUNCTION_WORDS = new Set(
  "to of out in on at by for from with using via over per than and or across into within under up down plus more through after before during while when since".split(" "),
);

const words = (s: string) => contentWords(s).filter((w) => /^[a-z]/.test(w));

/**
 * Each place `raw` appears, as a whole number: the word right after it, up to 5
 * content words after it and 3 before it, within one clause.
 */
function around(text: string, raw: string) {
  const re = new RegExp(`(?<![\\w.,])${escapeRe(raw)}(?![\\w]|[.,]\\d)`, "g");
  return [...text.matchAll(re)].map((m) => {
    const before = text.slice(0, m.index).split(/[.;:,\n]/).at(-1)!;
    const after = text.slice(m.index + raw.length).split(/[.;:,\n]/)[0];
    const first = after.match(/^\s+([A-Za-z][A-Za-z-]*)/)?.[1] ?? "";
    return { first, phrase: first ? `${raw} ${first}` : raw, after, near: [...words(before).slice(-3), ...words(after).slice(0, 5)] };
  });
}

// Prefix match, so "image" and "imag" (from "images") count as one word.
const sameWord = (a: string, b: string) => a.startsWith(b) || b.startsWith(a);

/**
 * Same whole number in bullet and fact, but the words after it in the bullet
 * share nothing with the words around it in the fact: "120 bookings" from "120
 * members". Only a warning, because honest rewording ("85 students" for "85
 * classmates") looks the same to plain code.
 */
function countedNounWarning(claim: NumberClaim, text: string, evidence: string): Warning | null {
  // Whole counts only: "0.84 macro F1" is a score, not a count of something.
  if (claim.unit !== "plain" || !/^\d[\d,]*$/.test(claim.raw)) return null;
  const mine = around(text, claim.raw)[0];
  if (!mine?.first || FUNCTION_WORDS.has(mine.first.toLowerCase())) return null;
  const counted = words(mine.after).slice(0, 5);
  const theirs = around(evidence, claim.raw);
  if (theirs.length === 0) return null;
  for (const t of theirs) {
    if (t.near.some((w) => counted.some((x) => sameWord(w, x)))) return null;
    // "3 VMs" for "3 virtual machines".
    if (abbreviationBacked(mine.first, t.after)) return null;
  }
  return { type: "counted-noun", claim: mine.phrase, fact: theirs[0].phrase };
}

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

const CALENDAR_WORDS = new Set(
  "January February March April May June July August September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday".split(
    " ",
  ),
);

const WEAK_STARTS = new Set(["responsible", "helped", "worked", "assisted", "participated", "involved", "tasked"]);

export const MAX_BULLET_WORDS = 32;

export function checkBullet(bullet: BulletDraft, facts: Fact[], experiences: Experience[] = []): GuardResult {
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
  const citedTexts = cited.map(factText);
  for (const claim of extractNumbers(bullet.text)) {
    if (seen.has(claim.raw)) continue;
    seen.add(claim.raw);
    if (evidenceNumbers.some((e) => sameClaim(claim, e))) {
      const w = countedNounWarning(claim, bullet.text, evidence);
      if (w) warnings.push(w);
    } else if (!derivable(claim, bullet.text, citedTexts)) {
      violations.push({ type: "number", claim: claim.raw });
    }
  }

  // Names (not numbers) may also come from the bullet's own experience title
  // and organisation: "for the KIT Robotics Club" under that experience is fine.
  const own = experiences.find((e) => e.id === bullet.experienceId);
  const nameEvidence = own ? `${evidence}\n${own.title}\n${own.org}` : evidence;

  // A fact naming Jest also backs "automated testing" in the bullet.
  const evidenceTech = withImplied(findTechTerms(nameEvidence));
  const bulletTech = findTechTerms(bullet.text);
  for (const term of bulletTech) {
    if (!evidenceTech.has(term)) violations.push({ type: "tech", term });
  }

  const evidenceLower = nameEvidence.toLowerCase();
  for (const m of bullet.text.matchAll(TECHY_TOKEN_RE)) {
    const token = m[0];
    if (GENERIC_ACRONYMS.has(token)) continue;
    // Already judged by the vocabulary check above.
    if (findTechTerms(token).length > 0) continue;
    if (evidenceLower.includes(token.toLowerCase()) || abbreviationBacked(token, nameEvidence)) continue;
    violations.push({ type: "term", term: token });
  }

  // A capitalised word in mid-sentence is almost always a name: a product
  // ("Splunk", "Jupyter-based"), a company or a place. It must come from the facts.
  for (const m of bullet.text.matchAll(/(?<![\w.'-])[A-Z][a-z]+/g)) {
    const word = m[0];
    const before = bullet.text.slice(0, m.index).trimEnd();
    if (before === "" || /[.!?:;]$/.test(before)) continue; // sentence start
    if (CALENDAR_WORDS.has(word) || findTechTerms(word).length > 0) continue;
    if (violations.some((v) => "term" in v && v.term.toLowerCase().includes(word.toLowerCase()))) continue;
    if (!new RegExp(`\\b${word}`, "i").test(nameEvidence)) violations.push({ type: "term", term: word });
  }

  const words = bullet.text.trim().split(/\s+/).filter(Boolean);
  if (words.length > MAX_BULLET_WORDS) warnings.push({ type: "too-long", words: words.length });
  const first = words[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (WEAK_STARTS.has(first)) warnings.push({ type: "weak-start", word: words[0] });

  return { ok: violations.length === 0, violations, warnings };
}

export function describeWarning(w: Warning): string {
  switch (w.type) {
    case "too-long":
      return `${w.words} words; aim for 30 or fewer`;
    case "weak-start":
      return `Starts with "${w.word}"; lead with what you did`;
    case "counted-noun":
      return `"${w.claim}" may count something else; the fact says "${w.fact}"`;
  }
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
