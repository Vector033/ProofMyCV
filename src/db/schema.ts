import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import type { ExperienceKind, JobAnalysis } from "@/lib/core/types";

// Every table hangs off auth.users with ON DELETE CASCADE, so deleting the
// account deletes all of the user's data. RLS is on with no policies: the app
// reads through the server-side DATABASE_URL connection and filters by user id
// itself, and the public Supabase API key cannot read these tables at all.

const owner = () =>
  uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const profiles = pgTable("profiles", {
  userId: owner().primaryKey(),
  fullName: text("full_name").notNull().default(""),
  headline: text("headline").notNull().default(""),
  /** One line of contact details exactly as it should print, e.g. "email · phone · city". */
  contact: text("contact").notNull().default(""),
  links: text("links").notNull().default(""),
  ...timestamps,
}).enableRLS();

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    kind: text("kind").$type<ExperienceKind>().notNull(),
    title: text("title").notNull(),
    org: text("org").notNull().default(""),
    location: text("location"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    sort: integer("sort").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("experiences_user_idx").on(t.userId)],
).enableRLS();

export const facts = pgTable(
  "facts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    did: text("did").notNull(),
    result: text("result"),
    tech: text("tech").array().notNull().default([]),
    ...timestamps,
  },
  (t) => [index("facts_user_idx").on(t.userId), index("facts_experience_idx").on(t.experienceId)],
).enableRLS();

export type SavedBullet = { experienceId: string; text: string; factIds: string[] };

/** One tailored resume version per job applied to. */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: owner(),
    company: text("company").notNull().default(""),
    role: text("role").notNull().default(""),
    jdText: text("jd_text").notNull(),
    analysis: jsonb("analysis").$type<JobAnalysis>().notNull(),
    analyzedBy: text("analyzed_by").notNull(),
    bullets: jsonb("bullets").$type<SavedBullet[]>().notNull().default([]),
    score: integer("score").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("applications_user_idx").on(t.userId)],
).enableRLS();
