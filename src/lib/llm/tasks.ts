import { z } from "zod";
import type { LlmProvider } from "./provider";
import { checkBullet, type GuardResult } from "../core/guard";
import { extractJobRuleBased, normaliseAnalysis } from "../core/jd";
import type { BulletDraft, Experience, Fact, JobAnalysis } from "../core/types";

const analysisSchema = z.object({
  role: z.string(),
  company: z.string().nullable(),
  requirements: z
    .array(
      z.object({
        name: z.string().describe("Short canonical name, e.g. 'PostgreSQL', 'unit testing'"),
        kind: z.enum(["skill", "keyword"]),
        importance: z.enum(["required", "preferred"]),
      }),
    )
    .max(40),
  problems: z.array(z.string()).max(8),
});

const ANALYSIS_SYSTEM = `You read job descriptions for a resume tool.
Return the role title, the company if named, the requirements, and the problems the employer wants solved.
- "skill": a concrete technology, language, framework, tool or method (e.g. React, Docker, unit testing).
- "keyword": a domain or soft term worth mirroring (e.g. "booking platform", "stakeholder communication").
- importance is "preferred" only when the text says nice to have / plus / bonus / preferred.
- problems: up to 8 short phrases in the employer's words.
Only list what the text says. Do not infer extra skills.`;

export async function analyzeJob(llm: LlmProvider | null, jd: string): Promise<JobAnalysis> {
  if (!llm) return extractJobRuleBased(jd);
  const raw = await llm.json({ system: ANALYSIS_SYSTEM, prompt: jd, schema: analysisSchema });
  return normaliseAnalysis(raw);
}

const bulletsSchema = z.object({
  bullets: z
    .array(
      z.object({
        experienceId: z.string(),
        text: z.string(),
        factIds: z.array(z.string()).min(1),
      }),
    )
    .max(24),
});

export const BULLETS_SYSTEM = `You turn a candidate's fact bank into resume bullets for one job. You never invent anything.

Write in Google's XYZ shape: accomplished X, as measured by Y, by doing Z.
- Every bullet starts with a past-tense verb. When the fact has a measured result, the verb names the outcome and takes it as its object: "Cut load time from 4.1 s to 1.8 s", "Reached 1,200 users", "Raised coverage to 72%" (not "Grew to 1,200").
- Put the measured result (Y) early, with its number and unit exactly as written in the fact.
- Say how (Z) in a short "by ..." clause, naming the tools from the cited facts that the job asks for (up to three), woven into the clause. Leave out tools the job does not mention; the skills section lists them.
- Rewrite. Do not copy the fact's sentence and do not append the fact's tech list. Never end a bullet with "using A, B, and C".
- If two facts from the same experience describe one achievement, combine them into one bullet and cite both.
- Keep team context: if a fact says "with 3 classmates" or "in a team", keep it.
- If a fact has no number, write no number; make the bullet concrete instead (what, for whom, which scope).
- 12 to 28 words. English.

Truth rules (checked by code after you answer):
- Every bullet lists the ids of the facts it uses in factIds.
- Use only numbers, units, technologies and product names that appear in the cited facts.
- Use the job's wording only where a fact really supports it. Never add a job keyword the facts do not support.

Write 1 to 3 bullets per experience, most relevant to the job first. Skip experiences with nothing relevant.

Examples (from a different candidate):
Fact: Added a Redis cache in front of the product API | Result: p95 latency went from 800 ms to 120 ms | Tech: Redis, Node.js
Bad: Added a Redis cache in front of the product API, so p95 latency went from 800 ms to 120 ms, using Redis and Node.js.
Good: Cut product API p95 latency from 800 ms to 120 ms by adding a Redis cache in front of it.

Fact: Set up linting and pre-commit hooks for the team repository with 4 classmates | Result: none | Tech: ESLint, Husky
Bad: Standardised code quality across a 5-person team with ESLint and Husky. ("5-person" is arithmetic the fact never states.)
Good: Set up ESLint and Husky pre-commit hooks with 4 classmates so every commit to the team repository is linted.`;

export type BulletCandidate = BulletDraft & { guard: GuardResult };

export function factsPrompt(analysis: JobAnalysis, experiences: Experience[], facts: Fact[]) {
  const job = [
    `Role: ${analysis.role}`,
    `Requirements: ${analysis.requirements.map((r) => `${r.name} (${r.importance})`).join(", ")}`,
    `Problems: ${analysis.problems.join("; ")}`,
  ].join("\n");
  const bank = experiences
    .map((e) => {
      const lines = facts
        .filter((f) => f.experienceId === e.id)
        .map((f) => `  - [${f.id}] ${f.did}${f.result ? ` | Result: ${f.result}` : ""}${f.tech.length ? ` | Tech: ${f.tech.join(", ")}` : ""}`);
      return `Experience ${e.id}: ${e.title} at ${e.org}\n${lines.join("\n")}`;
    })
    .join("\n\n");
  return `JOB\n${job}\n\nFACT BANK\n${bank}`;
}

export async function draftBullets(
  llm: LlmProvider,
  analysis: JobAnalysis,
  experiences: Experience[],
  facts: Fact[],
  /** Override the system prompt (used by the eval to compare prompt versions). */
  system = BULLETS_SYSTEM,
): Promise<BulletCandidate[]> {
  const { bullets } = await llm.json({
    system,
    prompt: factsPrompt(analysis, experiences, facts),
    schema: bulletsSchema,
  });
  const known = new Set(experiences.map((e) => e.id));
  return bullets
    .filter((b) => known.has(b.experienceId))
    .map((b) => ({ ...b, text: b.text.trim(), guard: checkBullet(b, facts, experiences) }));
}

