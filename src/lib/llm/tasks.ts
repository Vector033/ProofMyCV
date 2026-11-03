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

const BULLETS_SYSTEM = `You write resume bullets from a fact bank. You never invent anything.
Rules:
- Use Google's XYZ formula where the facts allow: accomplished X, measured by Y, by doing Z.
- Every bullet cites the ids of the facts it is built from in factIds.
- Use only numbers that appear in the cited facts, exactly as written. If a fact has no number, write no number.
- Name only technologies that appear in the cited facts.
- Prefer the job's wording when a fact really supports it. Never add a job keyword the facts do not support.
- Start with a strong past-tense verb. Maximum 30 words. English.
- Write 1 to 3 bullets per experience, most relevant to the job first. Skip experiences with nothing relevant.`;

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
): Promise<BulletCandidate[]> {
  const { bullets } = await llm.json({
    system: BULLETS_SYSTEM,
    prompt: factsPrompt(analysis, experiences, facts),
    schema: bulletsSchema,
  });
  const known = new Set(experiences.map((e) => e.id));
  return bullets
    .filter((b) => known.has(b.experienceId))
    .map((b) => ({ ...b, text: b.text.trim(), guard: checkBullet(b, facts) }));
}

