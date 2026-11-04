// Live eval against the real model: npm run eval:live [-- --limit 5] [--prompt v1] [--rules-analysis]
// --prompt v1 drafts with an earlier prompt from eval/prompts.ts (default: the current one).
// --rules-analysis skips the model's job analysis, so two prompt runs differ only in drafting.
// For each case: analyse the posting, draft bullets, run the guard, and check
// the accepted bullets against the case labels. Writes eval/results/*.json and
// prints a markdown summary.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getLlm } from "@/lib/llm/provider";
import { analyzeJob, BULLETS_SYSTEM, draftBullets, type BulletCandidate } from "@/lib/llm/tasks";
import { extractJobRuleBased } from "@/lib/core/jd";
import { matchRequirements } from "@/lib/core/match";
import { mentions } from "@/lib/core/vocab";
import {
  bank,
  baitLeaks,
  loadCases,
  MAX_BULLET_WORDS,
  pct,
  scoreExtraction,
  sumExtraction,
  wordCount,
  type ExtractionScore,
} from "./metrics";
import { PROMPTS } from "./prompts";
import { checkStyle, summariseStyle } from "./style";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Use the environment as is.
}

const limitArg = process.argv.indexOf("--limit");
const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;
const promptArg = process.argv.indexOf("--prompt");
const promptName = promptArg > 0 ? process.argv[promptArg + 1] : "current";
const system = promptName === "current" ? BULLETS_SYSTEM : PROMPTS[promptName];
if (!system) throw new Error(`Unknown prompt ${promptName}`);
const rulesAnalysis = process.argv.includes("--rules-analysis");
const llm = getLlm();
if (!llm) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

type CaseResult = {
  id: string;
  model: string;
  seconds: number;
  extraction: ExtractionScore;
  drafts: (BulletCandidate & { words: number; leaks: string[] })[];
  coverage: { coverable: number; mentioned: number };
  error?: string;
};

const cases = loadCases().slice(0, limit);
const results: CaseResult[] = [];
const ruleScores: ExtractionScore[] = [];

for (const c of cases) {
  ruleScores.push(scoreExtraction(c, extractJobRuleBased(c.jd)));
  const start = Date.now();
  try {
    const analysis = rulesAnalysis ? extractJobRuleBased(c.jd) : await analyzeJob(llm, c.jd);
    const model = llm.name;
    const { experiences, facts } = bank(c);
    const candidates = await draftBullets(llm, analysis, experiences, facts, system);
    const drafts = candidates.map((d) => ({ ...d, words: wordCount(d.text), leaks: baitLeaks(c, d.text) }));
    // Labelled skills the facts can back: how many of them made it into an accepted bullet?
    const labels = [...c.expected.required, ...c.expected.preferred];
    const fit = matchRequirements(
      { role: "", requirements: labels.map((name) => ({ name, kind: "skill", importance: "required" })), problems: [] },
      facts,
      experiences,
    );
    const coverable = fit.matches.filter((m) => m.factIds.length > 0).map((m) => m.requirement.name);
    const accepted = drafts.filter((d) => d.guard.ok);
    const mentioned = coverable.filter((s) => accepted.some((d) => mentions(d.text, s)));
    results.push({
      id: c.id,
      model,
      seconds: (Date.now() - start) / 1000,
      extraction: scoreExtraction(c, analysis),
      drafts,
      coverage: { coverable: coverable.length, mentioned: mentioned.length },
    });
    console.error(`${c.id}: ${drafts.length} drafts, ${drafts.filter((d) => !d.guard.ok).length} blocked (${model})`);
  } catch (e) {
    results.push({
      id: c.id,
      model: llm.name,
      seconds: (Date.now() - start) / 1000,
      extraction: { required: { total: 0, found: 0 }, all: { total: 0, found: 0 }, extracted: 0, matchedExtracted: 0 },
      drafts: [],
      coverage: { coverable: 0, mentioned: 0 },
      error: e instanceof Error ? e.message : String(e),
    });
    console.error(`${c.id}: ERROR ${e instanceof Error ? e.message : e}`);
  }
  // Stay well inside free-tier rate limits.
  await new Promise((r) => setTimeout(r, 4000));
}

const ok = results.filter((r) => !r.error);
const drafts = ok.flatMap((r) => r.drafts);
const accepted = drafts.filter((d) => d.guard.ok);
const blocked = drafts.filter((d) => !d.guard.ok);
const leakedRaw = drafts.filter((d) => d.leaks.length > 0);
const leakedAccepted = accepted.filter((d) => d.leaks.length > 0);
const llmExtraction = sumExtraction(ok.map((r) => r.extraction));
const ruleExtraction = sumExtraction(ruleScores);
const cov = ok.reduce((t, r) => ({ a: t.a + r.coverage.mentioned, b: t.b + r.coverage.coverable }), { a: 0, b: 0 });
const models = [...new Set(ok.map((r) => r.model))].join(", ");
const caseById = new Map(cases.map((c) => [c.id, c]));
const style = summariseStyle(
  ok.flatMap((r) => r.drafts.map((d) => checkStyle(d.text, caseById.get(r.id)!.facts.filter((f) => d.factIds.includes(f.id))))),
);

const summary = {
  date: new Date().toISOString(),
  prompt: promptName,
  analysis: rulesAnalysis ? "rules" : "llm",
  style,
  models,
  cases: results.length,
  errors: results.length - ok.length,
  drafts: drafts.length,
  blockedByGuard: blocked.length,
  baitLeaksBeforeGuard: leakedRaw.length,
  baitLeaksAfterGuard: leakedAccepted.length,
  keywordCoverage: cov.b ? cov.a / cov.b : 0,
  meanWords: accepted.length ? accepted.reduce((t, d) => t + d.words, 0) / accepted.length : 0,
  overLength: accepted.filter((d) => d.words > MAX_BULLET_WORDS).length,
  extraction: { llm: llmExtraction, rules: ruleExtraction },
  medianSeconds: ok.map((r) => r.seconds).sort((a, b) => a - b)[Math.floor(ok.length / 2)] ?? 0,
};

const dir = join(process.cwd(), "eval", "results");
mkdirSync(dir, { recursive: true });
const stamp = summary.date.slice(0, 16).replace(/[:T]/g, "-");
writeFileSync(join(dir, `live-${stamp}-${promptName}.json`), JSON.stringify({ summary, results }, null, 2));

console.log(`## Live eval (${summary.date.slice(0, 10)}, ${models}, prompt ${promptName}, ${summary.analysis} analysis)

| Metric | Value |
|---|---|
| Cases (errors) | ${summary.cases} (${summary.errors}) |
| Drafted bullets | ${summary.drafts} |
| Blocked by the guard | ${summary.blockedByGuard} (${pct(summary.blockedByGuard / Math.max(1, summary.drafts))}) |
| Bait leaks in all drafts (no guard) | ${summary.baitLeaksBeforeGuard} |
| Bait leaks in accepted bullets | ${summary.baitLeaksAfterGuard} |
| Keyword coverage of accepted bullets | ${pct(summary.keywordCoverage)} |
| Mean words per accepted bullet | ${summary.meanWords.toFixed(1)} (${summary.overLength} over ${MAX_BULLET_WORDS}) |
| Skill extraction recall, required (LLM / rules) | ${pct(llmExtraction.requiredRecall)} / ${pct(ruleExtraction.requiredRecall)} |
| Skill extraction recall, all (LLM / rules) | ${pct(llmExtraction.recall)} / ${pct(ruleExtraction.recall)} |
| Skill extraction precision (LLM / rules) | ${pct(llmExtraction.precision)} / ${pct(ruleExtraction.precision)} |
| XYZ-style bullets (strong verb, keeps metric, no copy, no tool tail) | ${pct(style.xyzShape)} |
| Copies a fact sentence / ends in a tool list | ${pct(style.copiesFact)} / ${pct(style.toolTail)} |
| Median seconds per case | ${summary.medianSeconds.toFixed(1)} |
`);
