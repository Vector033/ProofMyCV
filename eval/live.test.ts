// Calls the real Gemini API. Opt-in only: `npm run test:live` (uses .env.local).
// Plain `npm test` and CI skip this file, so they never spend API quota.

import { describe, expect, it } from "vitest";
import { getLlm } from "@/lib/llm/provider";
import { analyzeJob, draftBullets } from "@/lib/llm/tasks";
import type { Experience, Fact } from "@/lib/core/types";

const live = process.env.LIVE === "1" || process.env.npm_lifecycle_event === "test:live";
if (live) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Fall back to whatever is already in the environment.
  }
}

const JD = `Junior Full-Stack Developer, Example Travel Co

What you'll do:
- Build and maintain REST APIs for our booking platform
- Speed up slow pages and reports for customers

Requirements:
- TypeScript and React
- Python or Node.js on the backend
- PostgreSQL and efficient SQL
- Automated testing (Jest or similar)

Nice to have:
- Docker, Kubernetes, AWS`;

const experiences: Experience[] = [
  { id: "e1", kind: "job", title: "Software Engineering Intern", org: "Lanna Logistics" },
  { id: "e2", kind: "project", title: "StudyBuddy", org: "Personal project" },
];
const facts: Fact[] = [
  { id: "f1", experienceId: "e1", did: "Rebuilt the parcel tracking page in React and TypeScript", result: "Page load went from 4.1 s to 1.3 s", tech: ["React", "TypeScript"] },
  { id: "f2", experienceId: "e1", did: "Added a PostgreSQL index and rewrote 2 slow reporting queries", result: "Daily report job dropped from 25 minutes to 3 minutes", tech: ["PostgreSQL", "SQL"] },
  { id: "f3", experienceId: "e1", did: "Wrote Jest tests for the shipping-rate calculator", result: "Caught 6 pricing bugs before release", tech: ["Jest", "TypeScript"] },
  { id: "f4", experienceId: "e2", did: "Built a FastAPI backend that answers questions from course slides with Gemini", result: "Used by 120 classmates during finals", tech: ["Python", "FastAPI", "Gemini"] },
];

describe.runIf(live)("Gemini (live)", () => {
  it("analyses a job description", { timeout: 120_000 }, async () => {
    const llm = getLlm();
    expect(llm, "GEMINI_API_KEY missing").not.toBeNull();
    const a = await analyzeJob(llm, JD);
    console.log(llm!.name, JSON.stringify(a, null, 2));
    const names = a.requirements.map((r) => r.name);
    expect(names).toEqual(expect.arrayContaining(["TypeScript", "React", "PostgreSQL"]));
    expect(a.requirements.find((r) => r.name === "Kubernetes")?.importance).toBe("preferred");
  });

  it("drafts bullets and the guard judges them", { timeout: 120_000 }, async () => {
    const llm = getLlm()!;
    const a = await analyzeJob(null, JD);
    const drafts = await draftBullets(llm, a, experiences, facts);
    for (const d of drafts) {
      console.log(d.guard.ok ? "OK     " : "BLOCKED", d.text, d.factIds, d.guard.violations);
    }
    expect(drafts.length).toBeGreaterThan(0);
  });
});
