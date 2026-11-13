import { extractNumbers } from "./guard";
import { canonicalTech, findTechTerms } from "./vocab";
import type { ExperienceKind } from "./types";

// Turns the plain text of an imported resume into proposed fact-bank entries.
// Nothing here is saved: the user reviews every entry first.

export type DraftFact = {
  did: string;
  result: string | null;
  tech: string[];
  /** Numbers in this fact that do not appear anywhere in the uploaded file. */
  unverified?: string[];
};

export type DraftExperience = {
  kind: ExperienceKind;
  title: string;
  org: string;
  startDate: string | null;
  endDate: string | null;
  facts: DraftFact[];
};

export const MAX_DRAFT_EXPERIENCES = 30;
export const MAX_DRAFT_FACTS = 20;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = String.raw`(?<![\w/])(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2}|\d{1,2}\/(?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}|(?:19|20)\d{2})(?![\w/])`;
const RANGE_RE = new RegExp(
  String.raw`\(?\s*(${MONTH})\s*(?:–|—|-|to)\s*(${MONTH}|present|current|now|ongoing)\s*\)?|\(?\s*(${MONTH})\s*\)?`,
  "i",
);

/** "Jun 2025" | "06/2025" | "2025-06" → "2025-06". A year alone gives null: the month would be made up. */
function toMonth(s: string): string | null {
  const t = s.trim().toLowerCase();
  const named = t.match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/);
  const numeric = t.match(/^(\d{1,2})\/(\d{4})$/);
  const iso = t.match(/^(\d{4})-(\d{2})$/);
  const [year, month] = named
    ? [named[2], MONTHS.indexOf(named[1]) + 1]
    : numeric
      ? [numeric[2], Number(numeric[1])]
      : iso
        ? [iso[1], Number(iso[2])]
        : ["", 0];
  return month >= 1 && month <= 12 ? `${year}-${String(month).padStart(2, "0")}` : null;
}

/** Pulls a date or date range out of a header line. */
export function parseDates(line: string): { start: string | null; end: string | null; rest: string; found: boolean } {
  const m = line.match(RANGE_RE);
  if (!m) return { start: null, end: null, rest: line, found: false };
  const rest = (line.slice(0, m.index) + line.slice(m.index! + m[0].length)).replace(/\s*[|,·•–—-]\s*$/, "").trim();
  if (m[3]) {
    const d = toMonth(m[3]);
    return { start: d, end: d, rest, found: true };
  }
  const ongoing = /^(present|current|now|ongoing)$/i.test(m[2]);
  return { start: toMonth(m[1]), end: ongoing ? null : toMonth(m[2]), rest, found: true };
}

const SECTIONS: [RegExp, ExperienceKind | null][] = [
  [/^((work|professional|relevant|industry)\s+)?(experience|employment( history)?|work history|internships?)$/, "job"],
  [/^((personal|academic|selected|side|key)\s+)?projects?$/, "project"],
  [/^education( (and|&) training)?$/, "education"],
  [/^(activities|extracurricular( activities)?|leadership( (and|&) activities)?|volunteer(ing)?( experience)?|involvement)$/, "activity"],
  [/\b(summary|profile|objective|about( me)?|skills?|languages?|certifications?|certificates|interests|hobbies|references|contact|awards?|honou?rs|publications|courses?|coursework)\b/, null],
];

/** Section kind for a heading line, null for a section to skip, undefined for a line that is not a heading. */
function sectionOf(line: string): ExperienceKind | null | undefined {
  if (line.length > 40 || /\d/.test(line)) return undefined;
  const key = line.toLowerCase().replace(/[:]+$/, "").replace(/\s+/g, " ").trim();
  for (const [re, kind] of SECTIONS) if (re.test(key)) return kind;
  return undefined;
}

// Word and PDF bullets, including the Symbol-font bullet (U+F0B7) Word leaves in PDFs.
const BULLET_RE = /^\s*(?:[•●▪■◦‣∙·*➢►▸✓–—-]|||o(?=\s))\s*/;

function splitTitleOrg(text: string): { title: string; org: string } {
  for (const sep of [" | ", " — ", " – ", " - ", " at ", " @ ", ", "]) {
    const i = text.indexOf(sep);
    if (i > 0) return { title: text.slice(0, i).trim(), org: text.slice(i + sep.length).trim() };
  }
  return { title: text.trim(), org: "" };
}

export function techIn(text: string): string[] {
  return findTechTerms(text).slice(0, 20);
}

/** Normalises extracted text: one trimmed line per row, single spaces, no empty lines. */
export function resumeLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[   \t]/g, " ")
    .split("\n")
    .map((l) => l.replace(/ {2,}/g, " ").trim())
    .filter(Boolean);
}

/**
 * Rule-based fallback for when no LLM is configured or the daily AI limit is
 * used up: section headings set the kind, bullet lines become facts, and the
 * non-bullet lines above them become the title, organisation and dates.
 */
export function parseResumeRuleBased(text: string): DraftExperience[] {
  const out: DraftExperience[] = [];
  let kind: ExperienceKind | null = "job"; // bullets before any heading are most likely work
  let cur: DraftExperience | null = null;
  let lastWasBullet = false;
  let seenHeading = false; // lines above the first heading are the name and contact block

  for (const line of resumeLines(text)) {
    const section = sectionOf(line);
    if (section !== undefined) {
      kind = section;
      seenHeading = true;
      cur = null;
      lastWasBullet = false;
      continue;
    }
    if (kind === null) continue;

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      const did = line.slice(bullet[0].length).trim();
      if (!did) continue;
      if (!cur) out.push((cur = { kind, title: "", org: "", startDate: null, endDate: null, facts: [] }));
      cur.facts.push({ did, result: null, tech: [] });
      lastWasBullet = true;
      continue;
    }

    // A wrapped bullet: the PDF broke one sentence over two lines.
    const last = cur?.facts.at(-1);
    if (lastWasBullet && last && /^[a-z0-9(&]/.test(line)) {
      last.did = `${last.did} ${line}`;
      continue;
    }
    lastWasBullet = false;
    if (!seenHeading) continue;

    const { start, end, rest, found } = parseDates(line);
    const hasDates = cur && (cur.startDate || cur.endDate);
    if (cur && cur.facts.length === 0 && (!cur.org || (found && !hasDates))) {
      // Another header line of the same entry: organisation and/or dates.
      if (found) [cur.startDate, cur.endDate] = [start, end];
      if (rest && !cur.org) cur.org = cur.title ? rest : "";
      if (rest && !cur.title) cur.title = rest;
      continue;
    }
    const { title, org } = splitTitleOrg(rest);
    out.push((cur = { kind, title, org, startDate: start, endDate: end, facts: [] }));
  }

  return finishDraft(
    out.filter((e) => e.title || e.facts.length),
    text,
  );
}

/**
 * Last pass for both the LLM and the rule-based draft: trims to the form limits,
 * fills tech from the vocabulary, drops tech the file never names, and marks
 * numbers the file does not contain so the review screen can point at them.
 */
export function finishDraft(experiences: DraftExperience[], source: string): DraftExperience[] {
  const sourceValues = new Set(extractNumbers(source).map((n) => n.value));
  const sourceTech = new Set(findTechTerms(source));
  const lower = source.toLowerCase();
  const named = (t: string) => lower.includes(t.toLowerCase()) || sourceTech.has(canonicalTech(t) ?? t);
  // A model may turn "2023 – 2027" into 2023-01 … 2027-12; keep only months the file writes.
  const months = new Set([...source.matchAll(new RegExp(MONTH, "gi"))].map((m) => toMonth(m[0])));
  const written = (d: string | null) => (d && months.has(d) ? d : null);

  return experiences.slice(0, MAX_DRAFT_EXPERIENCES).map((e) => ({
    kind: e.kind,
    title: e.title.trim().slice(0, 160),
    org: e.org.trim().slice(0, 160),
    startDate: written(e.startDate),
    endDate: written(e.endDate),
    facts: e.facts.slice(0, MAX_DRAFT_FACTS).map((f) => {
      const did = f.did.trim().slice(0, 400);
      const result = f.result?.trim().slice(0, 300) || null;
      const given = f.tech.length ? f.tech : techIn(`${did} ${result ?? ""}`);
      const tech = [...new Set(given.map((t) => t.trim()).filter((t) => t && named(t)).map((t) => canonicalTech(t) ?? t))].slice(0, 20);
      const unverified = extractNumbers(`${did} ${result ?? ""}`)
        .filter((n) => !sourceValues.has(n.value))
        .map((n) => n.raw);
      return unverified.length ? { did, result, tech, unverified } : { did, result, tech };
    }),
  }));
}
