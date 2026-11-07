"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as data from "@/lib/data";
import { requireUser, type SessionUser } from "@/lib/auth";
import { isDemoUser } from "@/lib/supabase/admin";
import { LIMITS, clientIp, hit, retryText } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { canonicalTech } from "@/lib/core/vocab";
import { checkBullet, describeViolation } from "@/lib/core/guard";
import { matchRequirements } from "@/lib/core/match";
import { getLlm, LlmError } from "@/lib/llm/provider";
import { analyzeJob, draftBullets, type BulletCandidate } from "@/lib/llm/tasks";

const text = (max: number) => z.string().trim().max(max);
const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s || null);
const month = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2})?$/)
  .transform((s) => s || null);

const form = (fd: FormData) => Object.fromEntries(fd) as Record<string, string>;

/**
 * Counts one Gemini call against the daily limit (per user; one shared bucket
 * for the demo account) and reports whether it may go ahead, so the owner's
 * free API quota cannot be drained by one visitor.
 */
async function allowAi(user: SessionUser) {
  return isDemoUser(user.email) ? hit(LIMITS.llmDemoDay, "demo") : hit(LIMITS.llmUserDay, user.id);
}

// ---------- profile ----------

const profileSchema = z.object({
  fullName: text(120),
  headline: text(160),
  contact: text(240),
  links: text(240),
});

export async function saveProfileAction(fd: FormData) {
  await data.saveProfile(profileSchema.parse(form(fd)));
  revalidatePath("/app/facts");
}

// ---------- experiences ----------

const experienceSchema = z.object({
  kind: z.enum(["job", "project", "education", "activity"]),
  title: text(160).min(1),
  org: text(160),
  location: optional(120),
  startDate: month,
  endDate: month,
});

export async function createExperienceAction(fd: FormData) {
  await data.createExperience(experienceSchema.parse(form(fd)));
  revalidatePath("/app/facts");
}

export async function updateExperienceAction(experienceId: string, fd: FormData) {
  await data.updateExperience(z.uuid().parse(experienceId), experienceSchema.parse(form(fd)));
  revalidatePath("/app/facts");
}

export async function deleteExperienceAction(experienceId: string) {
  await data.deleteExperience(z.uuid().parse(experienceId));
  revalidatePath("/app/facts");
}

// ---------- facts ----------

const factSchema = z.object({
  did: text(400).min(3),
  result: optional(300),
  tech: text(300).transform((s) =>
    [...new Set(s.split(",").map((t) => t.trim()).filter(Boolean).map((t) => canonicalTech(t) ?? t))].slice(0, 20),
  ),
});

export async function createFactAction(experienceId: string, fd: FormData) {
  await data.createFact(z.uuid().parse(experienceId), factSchema.parse(form(fd)));
  revalidatePath("/app/facts");
}

export async function updateFactAction(factId: string, fd: FormData) {
  await data.updateFact(z.uuid().parse(factId), factSchema.parse(form(fd)));
  revalidatePath("/app/facts");
}

export async function deleteFactAction(factId: string) {
  await data.deleteFact(z.uuid().parse(factId));
  revalidatePath("/app/facts");
}

// ---------- applications ----------

export type FormState = { error?: string };

const applicationSchema = z.object({
  company: text(120),
  role: text(160),
  jdText: text(20_000).min(80, "Paste the whole job description (at least a few lines)."),
});

export async function createApplicationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = applicationSchema.safeParse(form(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { company, role, jdText } = parsed.data;

  let llm = getLlm();
  let analyzedBy = llm ? "" : "rules";
  if (llm && !(await allowAi(await requireUser())).ok) {
    llm = null;
    analyzedBy = "rules (daily AI limit reached)";
  }
  let analysis;
  try {
    analysis = await analyzeJob(llm, jdText);
  } catch (e) {
    return { error: e instanceof LlmError ? `The model failed: ${e.message}` : "Could not analyse the job." };
  }
  const bank = await data.getFactBank();
  const id = await data.createApplication({
    company: company || analysis.company || "",
    role: role || analysis.role,
    jdText,
    analysis,
    analyzedBy: llm?.name ?? analyzedBy,
    score: matchRequirements(analysis, bank.facts, bank.experiences).score,
  });
  redirect(`/app/applications/${id}`);
}

export async function deleteApplicationAction(applicationId: string) {
  await data.deleteApplication(z.uuid().parse(applicationId));
  revalidatePath("/app");
  redirect("/app");
}

export type GenerateResult = { candidates?: BulletCandidate[]; error?: string };

export async function generateBulletsAction(applicationId: string): Promise<GenerateResult> {
  const llm = getLlm();
  if (!llm) return { error: "No LLM key is configured. Use your facts as written instead." };
  const app = await data.getApplication(z.uuid().parse(applicationId));
  if (!app) return { error: "Application not found." };
  const bank = await data.getFactBank();
  if (bank.facts.length === 0) return { error: "Add some facts to your fact bank first." };
  const limit = await allowAi(await requireUser());
  if (!limit.ok) {
    return { error: `Today's AI limit is used up (resets in ${retryText(limit.retryAfterSec)}). Your facts as written still work.` };
  }
  try {
    return { candidates: await draftBullets(llm, app.analysis, bank.experiences, bank.facts) };
  } catch (e) {
    return { error: e instanceof LlmError ? `The model failed: ${e.message}` : "Generation failed." };
  }
}

const bulletsSchema = z
  .array(
    z.object({
      experienceId: z.uuid(),
      text: text(400).min(3),
      factIds: z.array(z.uuid()).min(1).max(10),
    }),
  )
  .max(60);

export async function saveBulletsAction(applicationId: string, bullets: unknown): Promise<FormState> {
  const parsed = bulletsSchema.safeParse(bullets);
  if (!parsed.success) return { error: "Invalid bullets." };
  const bank = await data.getFactBank();
  // The guard runs again here: the client's verdict is never trusted.
  for (const b of parsed.data) {
    const factIds = b.factIds.filter((id) => bank.facts.some((f) => f.id === id && f.experienceId === b.experienceId));
    if (factIds.length !== b.factIds.length) return { error: `"${b.text}" cites facts from another experience.` };
    const r = checkBullet(b, bank.facts, bank.experiences);
    if (!r.ok) return { error: `Blocked: "${b.text}": ${r.violations.map(describeViolation).join("; ")}` };
  }
  await data.updateApplication(z.uuid().parse(applicationId), { bullets: parsed.data });
  revalidatePath(`/app/applications/${applicationId}`);
  return {};
}

// ---------- account ----------

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Deletes every FactFit row of the signed-in user. The sign-in itself lives in
 * a Supabase project shared with other apps, so it is not removed here.
 */
export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser();
  if (form(fd).confirm !== "delete" || isDemoUser(user.email)) return;
  await data.deleteAllMyData();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}

/** Restores the shared demo account to its fictional starting data. */
export async function resetDemoAction() {
  const user = await requireUser();
  if (!isDemoUser(user.email)) return;
  if (!(await hit(LIMITS.demoResetIp, await clientIp())).ok) return;
  await data.resetDemoData();
  revalidatePath("/app", "layout");
  redirect("/app");
}
