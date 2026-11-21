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
import { PDF_UNSAFE } from "@/lib/format";
import { checkBullet, describeViolation } from "@/lib/core/guard";
import { matchRequirements } from "@/lib/core/match";
import { getLlm, LlmError } from "@/lib/llm/provider";
import { analyzeJob, draftBullets, parseResume, type BulletCandidate } from "@/lib/llm/tasks";
import { MAX_DRAFT_EXPERIENCES, MAX_DRAFT_FACTS, parseResumeRuleBased, type DraftResume } from "@/lib/core/resume";
import { MAX_RESUME_BYTES, ResumeFileError, resumeText } from "@/lib/import/extract";

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
  .regex(/^(\d{4}(-\d{2})?)?$/) // "2024-06", or "2024" when only the year is known
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

/** Removes characters the PDF font cannot print (e.g. a stray Thai mark) from the resume header. */
export async function cleanProfileAction() {
  const p = await data.getProfile();
  const clean = (v: string) => v.replace(PDF_UNSAFE, "").replace(/\s{2,}/g, " ").trim();
  await data.saveProfile({ fullName: clean(p.fullName), headline: clean(p.headline), contact: clean(p.contact), links: clean(p.links) });
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

// ---------- resume import ----------

export type ImportState = { draft?: DraftResume; draftId?: string; parsedBy?: "ai" | "rules"; note?: string; error?: string };

const DEMO_IMPORT_OFF = "Import is off on the shared demo account, because every visitor sees its data. Sign up to import your own resume.";

/**
 * Reads an uploaded resume in memory and returns proposed entries. Nothing is
 * stored: not the file, not its text, not the draft. The user saves with saveImportAction.
 */
export async function importResumeAction(_prev: ImportState, fd: FormData): Promise<ImportState> {
  const user = await requireUser();
  if (isDemoUser(user.email)) return { error: DEMO_IMPORT_OFF };
  const file = fd.get("resume");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a .docx or .pdf file." };
  if (file.size > MAX_RESUME_BYTES) return { error: "The file is larger than 2 MB." };

  let text: string;
  try {
    text = await resumeText(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    if (e instanceof ResumeFileError) return { error: e.message };
    console.error("resume import: extraction failed", e instanceof Error ? e.name : e);
    return { error: "This file could not be read. Try saving it again as .docx or .pdf." };
  }

  let llm = getLlm();
  let note: string | undefined;
  if (llm && !(await allowAi(user)).ok) {
    llm = null;
    note = "Today's AI limit is used up, so simple rules read your file instead.";
  }
  let draft: DraftResume;
  try {
    draft = await parseResume(llm, text);
  } catch (e) {
    // LlmError messages hold the HTTP status or schema error, never the resume text.
    console.error("resume import: parseResume failed", e instanceof LlmError ? e.message.slice(0, 300) : e instanceof Error ? e.name : e);
    llm = null;
    note = "The AI could not read the file just now, so simple rules read it instead.";
    draft = parseResumeRuleBased(text);
  }
  if (draft.experiences.length === 0 && !Object.values(draft.profile).some(Boolean)) {
    return { error: "No experiences or bullet points were found in this file. Add them by hand below." };
  }
  return { draft, draftId: crypto.randomUUID(), parsedBy: llm ? "ai" : "rules", note };
}

const importSchema = z
  .array(experienceSchema.extend({ facts: z.array(factSchema).max(MAX_DRAFT_FACTS) }))
  .max(MAX_DRAFT_EXPERIENCES);

/** Saves the entries the user ticked on the review screen, after the same checks as the manual forms. */
export async function saveImportAction(entries: unknown, header: unknown = {}): Promise<FormState & { saved?: number }> {
  const user = await requireUser();
  if (isDemoUser(user.email)) return { error: DEMO_IMPORT_OFF };
  const parsed = importSchema.safeParse(entries);
  // Only the header fields the user kept ticked; the rest of the saved header stays as it is.
  const headerPatch = profileSchema.partial().safeParse(header);
  const patch = headerPatch.success ? headerPatch.data : {};
  if (parsed.success && parsed.data.length === 0 && Object.keys(patch).length === 0) {
    return { error: "Tick at least one entry to save." };
  }
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.path.length === 0 ? "Too many entries to save at once." : "Every entry needs a title, and every fact at least a few words." };
  }
  let saved = 0;
  for (const { facts, ...experience } of parsed.data) {
    const experienceId = await data.createExperience(experience);
    for (const fact of facts) {
      await data.createFact(experienceId, fact);
      saved++;
    }
  }
  if (Object.keys(patch).length) {
    const p = await data.getProfile();
    await data.saveProfile({ fullName: p.fullName, headline: p.headline, contact: p.contact, links: p.links, ...patch });
  }
  revalidatePath("/app/facts");
  return { saved };
}

// ---------- applications ----------

export type FormState = { error?: string; values?: Record<string, string> };

const applicationSchema = z.object({
  company: text(120),
  role: text(160),
  jdText: text(20_000).min(80, "Paste the whole job description (at least a few lines)."),
});

export async function createApplicationAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = form(fd);
  const parsed = applicationSchema.safeParse(values);
  // Hand the typed values back on error: React resets the form after an action.
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
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
    console.error("analyzeJob failed", e instanceof LlmError ? e.message : e);
    return { error: "The AI could not analyse this posting just now. Your text is still here; try again in a minute.", values };
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
    console.error("draftBullets failed", e instanceof LlmError ? e.message : e);
    return { error: "AI drafting failed just now. Try again in a minute, or add your facts as written below." };
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
  if (!parsed.success) return { error: "These bullets could not be saved. Reload the page and try again." };
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
  if (form(fd).confirm?.trim().toLowerCase() !== "delete" || isDemoUser(user.email)) return;
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
