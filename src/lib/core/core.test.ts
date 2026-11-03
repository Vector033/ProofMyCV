import { describe, expect, it } from "vitest";
import { canonicalTech, findTechTerms, mentions } from "./vocab";
import { checkBullet, extractNumbers } from "./guard";
import { extractJobRuleBased } from "./jd";
import { matchRequirements } from "./match";
import type { Fact } from "./types";

const facts: Fact[] = [
  {
    id: "f1",
    experienceId: "e1",
    did: "Designed 3 FastAPI services behind a Vue 3 frontend",
    result: "Cut report generation from 40 s to 6 s",
    tech: ["FastAPI", "Vue", "Firestore"],
  },
  {
    id: "f2",
    experienceId: "e1",
    did: "Wrote pytest suites for the grading service",
    result: "Coverage went to 85%",
    tech: ["Python", "pytest"],
  },
  {
    id: "f3",
    experienceId: "e2",
    did: "Built a Roblox zombie shooter with 14 maps",
    result: "1,200 visits in the first month",
    tech: ["Luau", "Roblox"],
  },
];

describe("vocab", () => {
  it("canonicalises aliases", () => {
    expect(canonicalTech("postgres")).toBe("PostgreSQL");
    expect(canonicalTech("ReactJS")).toBe("React");
    expect(canonicalTech("k8s")).toBe("Kubernetes");
    expect(canonicalTech("Banana")).toBeUndefined();
  });

  it("finds terms with symbol-aware boundaries", () => {
    expect(findTechTerms("Node.js and C# with C++.")).toEqual(
      expect.arrayContaining(["Node.js", "C#", "C++"]),
    );
    expect(findTechTerms("Node.js")).not.toContain("JavaScript");
    expect(findTechTerms("ASP.NET Core")).toContain(".NET");
  });

  it("does not treat plain English as technology", () => {
    expect(findTechTerms("the rest of the team will go to spring training and excel")).toEqual([]);
    expect(findTechTerms("Built REST APIs in Go")).toEqual(expect.arrayContaining(["REST", "Go"]));
  });

  it("keeps React Native separate from React", () => {
    expect(findTechTerms("React Native app")).toEqual(["React Native"]);
    expect(findTechTerms("React and React Native")).toEqual(
      expect.arrayContaining(["React", "React Native"]),
    );
  });

  it("matches non-vocabulary phrases by content words", () => {
    expect(mentions("Wrote unit tests for every endpoint", "unit testing")).toBe(true);
    expect(mentions("Wrote docs", "unit testing")).toBe(false);
  });
});

describe("extractNumbers", () => {
  it("reads digits, separators, scales and units", () => {
    const got = extractNumbers("Served 1,200 users, 2.5k requests, 30% faster, 3x throughput");
    expect(got.map((n) => [n.value, n.unit])).toEqual([
      [1200, "plain"],
      [2500, "plain"],
      [30, "percent"],
      [3, "times"],
    ]);
  });

  it("ignores digits inside names", () => {
    expect(extractNumbers("Deployed to EC2 and S3 with Web3")).toEqual([]);
  });

  it("reads number and multiplier words", () => {
    expect(extractNumbers("three services, doubled throughput").map((n) => [n.value, n.unit])).toEqual([
      [3, "plain"],
      [2, "times"],
    ]);
  });
});

describe("checkBullet", () => {
  it("passes a bullet that only uses cited facts", () => {
    const r = checkBullet(
      {
        experienceId: "e1",
        text: "Cut report generation from 40 s to 6 s by designing three FastAPI services behind a Vue 3 frontend",
        factIds: ["f1"],
      },
      facts,
    );
    expect(r.violations).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("blocks invented numbers", () => {
    const r = checkBullet(
      { experienceId: "e1", text: "Cut report generation time by 85% using FastAPI", factIds: ["f1"] },
      facts,
    );
    expect(r.ok).toBe(false);
    expect(r.violations).toContainEqual({ type: "number", claim: "85%" });
  });

  it("does not let a number from an uncited fact through", () => {
    const r = checkBullet(
      { experienceId: "e1", text: "Raised test coverage to 85% with pytest", factIds: ["f1"] },
      facts,
    );
    expect(r.violations).toContainEqual({ type: "number", claim: "85%" });
    expect(r.violations).toContainEqual({ type: "tech", term: "Pytest" });
  });

  it("blocks a unit swap", () => {
    const r = checkBullet(
      { experienceId: "e1", text: "Made reports 40% faster with FastAPI", factIds: ["f1"] },
      facts,
    );
    expect(r.violations).toContainEqual({ type: "number", claim: "40%" });
  });

  it("blocks multiplier words without evidence", () => {
    const r = checkBullet(
      { experienceId: "e2", text: "Doubled visits to a Roblox shooter", factIds: ["f3"] },
      facts,
    );
    expect(r.violations).toContainEqual({ type: "number", claim: "doubled" });
  });

  it("blocks technologies not in the cited facts", () => {
    const r = checkBullet(
      {
        experienceId: "e1",
        text: "Designed 3 FastAPI services on Kubernetes with a GraphQL gateway",
        factIds: ["f1"],
      },
      facts,
    );
    expect(r.violations).toEqual(
      expect.arrayContaining([
        { type: "tech", term: "Kubernetes" },
        { type: "tech", term: "GraphQL" },
      ]),
    );
  });

  it("blocks unknown tool-like names outside the vocabulary", () => {
    const r = checkBullet(
      { experienceId: "e1", text: "Designed 3 FastAPI services and queued jobs in SQS via BullMQ", factIds: ["f1"] },
      facts,
    );
    expect(r.violations).toEqual(
      expect.arrayContaining([
        { type: "term", term: "SQS" },
        { type: "term", term: "BullMQ" },
      ]),
    );
  });

  it("allows generic acronyms", () => {
    const r = checkBullet(
      { experienceId: "e1", text: "Designed 3 FastAPI services exposing the API to the UI", factIds: ["f1"] },
      facts,
    );
    expect(r.ok).toBe(true);
  });

  it("blocks bullets without valid citations", () => {
    expect(checkBullet({ experienceId: "e1", text: "Built things", factIds: [] }, facts).violations).toContainEqual({
      type: "no-citation",
    });
    expect(checkBullet({ experienceId: "e1", text: "Built things", factIds: ["nope"] }, facts).violations).toContainEqual({
      type: "unknown-fact",
      factId: "nope",
    });
  });

  it("warns on weak starts and long bullets", () => {
    const r = checkBullet(
      { experienceId: "e1", text: `Responsible for ${"FastAPI ".repeat(35)}`, factIds: ["f1"] },
      facts,
    );
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.type)).toEqual(["too-long", "weak-start"]);
  });
});

const JD = `Junior Full-Stack Developer

What you'll do:
- Build and maintain REST APIs for our booking platform
- Ship features end to end with the product team

Requirements:
- Experience with TypeScript and React
- Python or Node.js on the backend
- PostgreSQL

Nice to have:
- Docker, Kubernetes
- Python testing with pytest
`;

describe("extractJobRuleBased", () => {
  const a = extractJobRuleBased(JD);

  it("pulls skills with importance", () => {
    const get = (n: string) => a.requirements.find((r) => r.name === n)?.importance;
    expect(get("TypeScript")).toBe("required");
    expect(get("PostgreSQL")).toBe("required");
    expect(get("Python")).toBe("required"); // required wins over the later "nice to have"
    expect(get("Docker")).toBe("preferred");
    expect(get("Pytest")).toBe("preferred");
  });

  it("pulls role and problems", () => {
    expect(a.role).toBe("Junior Full-Stack Developer");
    expect(a.problems[0]).toMatch(/REST APIs/);
  });
});

describe("matchRequirements", () => {
  it("maps evidence and scores by weight", () => {
    const report = matchRequirements(
      {
        role: "x",
        requirements: [
          { name: "Python", kind: "skill", importance: "required" },
          { name: "Vue", kind: "skill", importance: "required" },
          { name: "Kubernetes", kind: "skill", importance: "preferred" },
          { name: "Lua", kind: "skill", importance: "preferred" },
        ],
        problems: [],
      },
      facts,
    );
    expect(report.matches.map((m) => m.factIds)).toEqual([["f2"], ["f1"], [], ["f3"]]);
    expect(report.score).toBe(Math.round((7 / 8) * 100));
    expect(report.covered).toBe(3);
  });
});
