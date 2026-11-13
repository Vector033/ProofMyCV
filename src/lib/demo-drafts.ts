// The fictional fact and draft bullets shown on the landing page and /login.
// Every verdict the UI shows for them comes from the real guard (demoCheck), and
// demo-drafts.test.ts pins those verdicts so the copy cannot drift from the code.

import { checkBullet, extractNumbers } from "@/lib/core/guard";
import { findTechTerms } from "@/lib/core/vocab";
import type { Experience, Fact } from "@/lib/core/types";

export const DEMO_EXPERIENCE: Experience = {
  id: "e1",
  kind: "job",
  title: "Software Engineering Intern",
  org: "Lanna Logistics",
};

export const DEMO_FACT: Fact = {
  id: "f1",
  experienceId: "e1",
  did: "Added a PostgreSQL index and rewrote 2 slow reporting queries",
  result: "Daily report job dropped from 25 minutes to 3 minutes",
  tech: ["PostgreSQL", "SQL"],
};

export const DEMO_DRAFTS = {
  invented:
    "Architected a PostgreSQL and Redis caching layer that cut reporting latency by 45% and saved $40K a year.",
  inventedTool: "Integrated a Kafka message queue and PostgreSQL to stream reporting metrics in real time.",
  faithful:
    "Cut the daily report job from 25 minutes to 3 minutes by adding a PostgreSQL index and rewriting 2 slow queries.",
  // Short pair for the pipeline diagram and the /login panel.
  inventedShort: "Cut reporting time by 90% with a Redis cache.",
  faithfulShort: "Cut the daily report job from 25 to 3 minutes with a PostgreSQL index.",
} as const;

export const demoCheck = (text: string) =>
  checkBullet({ experienceId: DEMO_EXPERIENCE.id, text, factIds: [DEMO_FACT.id] }, [DEMO_FACT], [DEMO_EXPERIENCE]);

/** The numbers and tool names in a draft: what the guard looked at. */
export const demoClaims = (text: string) => [...extractNumbers(text).map((n) => n.raw), ...findTechTerms(text)];

/** The offending text of each violation, for highlighting. */
export const violationTerms = (text: string) =>
  demoCheck(text).violations.flatMap((v) => ("claim" in v ? [v.claim] : "term" in v ? [v.term] : []));
