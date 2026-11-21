import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, experiences, facts, profiles, type SavedBullet } from "@/db/schema";
import { requireUser } from "./auth";
import { extractJobRuleBased } from "./core/jd";
import { DEMO_BANK, DEMO_JOB, DEMO_PROFILE } from "./demo-data";
import type { Experience, ExperienceKind, Fact, JobAnalysis } from "./core/types";

// Data Access Layer. Every function resolves the signed-in user itself and
// scopes its query to that user, so callers cannot ask for someone else's rows.

export async function getProfile() {
  const { id, email } = await requireUser();
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, id));
  return row ?? { userId: id, fullName: "", headline: "", contact: email, links: "" };
}

export async function saveProfile(p: { fullName: string; headline: string; contact: string; links: string }) {
  const { id } = await requireUser();
  await db
    .insert(profiles)
    .values({ userId: id, ...p })
    .onConflictDoUpdate({ target: profiles.userId, set: p });
}

export type FactBank = { experiences: Experience[]; facts: Fact[] };

export async function getFactBank(): Promise<FactBank> {
  const { id } = await requireUser();
  const [exps, fs] = await Promise.all([
    db
      .select()
      .from(experiences)
      .where(eq(experiences.userId, id))
      .orderBy(asc(experiences.sort), desc(experiences.startDate), asc(experiences.createdAt)),
    db.select().from(facts).where(eq(facts.userId, id)).orderBy(asc(facts.createdAt)),
  ]);
  return {
    experiences: exps.map((e) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      org: e.org,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    facts: fs.map((f) => ({ id: f.id, experienceId: f.experienceId, did: f.did, result: f.result, tech: f.tech })),
  };
}

export type ExperienceInput = {
  kind: ExperienceKind;
  title: string;
  org: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
};

export async function createExperience(input: ExperienceInput) {
  const { id } = await requireUser();
  const [row] = await db.insert(experiences).values({ ...input, userId: id }).returning({ id: experiences.id });
  return row.id;
}

export async function updateExperience(experienceId: string, input: ExperienceInput) {
  const { id } = await requireUser();
  await db
    .update(experiences)
    .set(input)
    .where(and(eq(experiences.id, experienceId), eq(experiences.userId, id)));
}

export async function deleteExperience(experienceId: string) {
  const { id } = await requireUser();
  await db.delete(experiences).where(and(eq(experiences.id, experienceId), eq(experiences.userId, id)));
}

export type FactInput = { did: string; result: string | null; tech: string[] };

export async function createFact(experienceId: string, input: FactInput) {
  const { id } = await requireUser();
  const [owned] = await db
    .select({ id: experiences.id })
    .from(experiences)
    .where(and(eq(experiences.id, experienceId), eq(experiences.userId, id)));
  if (!owned) throw new Error("Experience not found");
  await db.insert(facts).values({ ...input, experienceId, userId: id });
}

export async function updateFact(factId: string, input: FactInput) {
  const { id } = await requireUser();
  await db
    .update(facts)
    .set(input)
    .where(and(eq(facts.id, factId), eq(facts.userId, id)));
}

export async function deleteFact(factId: string) {
  const { id } = await requireUser();
  await db.delete(facts).where(and(eq(facts.id, factId), eq(facts.userId, id)));
}

export async function listApplications() {
  const { id } = await requireUser();
  return db
    .select({
      id: applications.id,
      company: applications.company,
      role: applications.role,
      analysis: applications.analysis,
      bullets: applications.bullets,
      updatedAt: applications.updatedAt,
    })
    .from(applications)
    .where(eq(applications.userId, id))
    .orderBy(desc(applications.updatedAt));
}

export async function getApplication(applicationId: string) {
  const { id } = await requireUser();
  const [row] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, id)));
  return row ?? null;
}

export async function createApplication(input: {
  company: string;
  role: string;
  jdText: string;
  analysis: JobAnalysis;
  analyzedBy: string;
  score: number;
}) {
  const { id } = await requireUser();
  const [row] = await db
    .insert(applications)
    .values({ ...input, userId: id })
    .returning({ id: applications.id });
  return row.id;
}

export async function updateApplication(
  applicationId: string,
  patch: Partial<{ bullets: SavedBullet[]; score: number; analysis: JobAnalysis; analyzedBy: string; company: string; role: string }>,
) {
  const { id } = await requireUser();
  await db
    .update(applications)
    .set(patch)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, id)));
}

export async function deleteApplication(applicationId: string) {
  const { id } = await requireUser();
  await db.delete(applications).where(and(eq(applications.id, applicationId), eq(applications.userId, id)));
}

/** Everything stored about the user, for the data export. */
export async function exportAll() {
  const { id, email } = await requireUser();
  const [profile, bank, apps] = await Promise.all([
    getProfile(),
    getFactBank(),
    db.select().from(applications).where(eq(applications.userId, id)),
  ]);
  return { email, profile, ...bank, applications: apps };
}


/** Deletes every FactFit row of the signed-in user (facts go with their experiences). */
export async function deleteAllMyData() {
  const { id } = await requireUser();
  await db.transaction(async (tx) => {
    await tx.delete(applications).where(eq(applications.userId, id));
    await tx.delete(experiences).where(eq(experiences.userId, id));
    await tx.delete(profiles).where(eq(profiles.userId, id));
  });
}

/** Replaces the signed-in (demo) user's data with the fictional demo fact bank and a sample job. */
export async function resetDemoData() {
  const { id } = await requireUser();
  await deleteAllMyData();
  await db.transaction(async (tx) => {
    await tx.insert(profiles).values({ userId: id, ...DEMO_PROFILE });
    for (const [i, e] of DEMO_BANK.entries()) {
      const [row] = await tx
        .insert(experiences)
        .values({ userId: id, kind: e.kind, title: e.title, org: e.org, location: e.location ?? null, startDate: e.start, endDate: e.end, sort: i })
        .returning({ id: experiences.id });
      for (const f of e.facts) {
        await tx.insert(facts).values({ userId: id, experienceId: row.id, did: f.did, result: f.result ?? null, tech: f.tech });
      }
    }
    await tx.insert(applications).values({
      userId: id,
      ...DEMO_JOB,
      analysis: extractJobRuleBased(DEMO_JOB.jdText),
      analyzedBy: "rules",
    });
  });
}
