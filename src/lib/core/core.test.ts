import { describe, expect, it } from "vitest";
import { canonicalTech, findTechTerms, mentions, normalizeTag } from "./vocab";
import { checkBullet, extractNumbers } from "./guard";
import { extractJobRuleBased } from "./jd";
import { backs, matchRequirements } from "./match";
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
      { experienceId: "e1", text: "Cut report generation time by 60% using FastAPI", factIds: ["f1"] },
      facts,
    );
    expect(r.ok).toBe(false);
    expect(r.violations).toContainEqual({ type: "number", claim: "60%" });
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

describe("implied terms", () => {
  it("lets a specific tool back the broader practice", () => {
    expect(mentions("Wrote Jest tests", "automated tests")).toBe(true);
    expect(mentions("Deployed with GitHub Actions", "CI")).toBe(true);
    expect(mentions("Answers questions with Gemini", "LLM APIs")).toBe(true);
    expect(mentions("Wrote docs", "automated tests")).toBe(false);
  });

  it("does not imply the specific tool from the practice", () => {
    expect(mentions("Wrote automated tests", "Jest")).toBe(false);
  });

  it("lets the guard accept the broader term but not a sibling tool", () => {
    const fact: Fact = { id: "j", experienceId: "e1", did: "Wrote Jest tests for checkout", tech: ["Jest"] };
    expect(checkBullet({ experienceId: "e1", text: "Added automated tests for checkout", factIds: ["j"] }, [fact]).ok).toBe(true);
    expect(
      checkBullet({ experienceId: "e1", text: "Added Cypress tests for checkout", factIds: ["j"] }, [fact]).violations,
    ).toContainEqual({ type: "tech", term: "Cypress" });
  });
});

describe("matchRequirements with experience context", () => {
  it("uses the experience title as evidence", () => {
    const report = matchRequirements(
      { role: "x", requirements: [{ name: "Computer Science", kind: "keyword", importance: "required" }], problems: [] },
      [{ id: "g", experienceId: "edu", did: "GPA 3.52", tech: [] }],
      [{ id: "edu", kind: "education", title: "B.Sc. Computer Science", org: "Example University" }],
    );
    expect(report.matches[0].factIds).toEqual(["g"]);
  });
});

describe("guard units and names", () => {
  const f: Fact = {
    id: "u",
    experienceId: "e1",
    did: "Fixed a memory leak in the gallery found with Instruments",
    result: "Peak memory fell from 380 MB to 150 MB; prep went from 2 days to 3 hours",
    tech: ["Swift"],
  };
  const check = (text: string) => checkBullet({ experienceId: "e1", text, factIds: ["u"] }, [f]);

  it("reads measurement units", () => {
    expect(extractNumbers("380 MB, 3-week, 410ms, $9, 2,000 mAh").map((n) => [n.value, n.unit])).toEqual([
      [380, "MB"],
      [3, "week"],
      [410, "ms"],
      [9, "USD"],
      [2000, "mAh"],
    ]);
  });

  it("blocks a changed unit and allows a bare number next to a measured one", () => {
    expect(check("Cut gallery load time from 380 ms to 150 ms").ok).toBe(false);
    expect(check("Cut prep from 2 weeks to 3 hours").ok).toBe(false);
    expect(check("Cut peak memory from 380 to 150 MB by fixing a leak found with Instruments").ok).toBe(true);
  });

  it("ignores hyphenated adjectives as multipliers", () => {
    expect(extractNumbers("blocked a double-charge bug in a single-page app")).toEqual([]);
  });

  it("blocks capitalised names that are not in the facts", () => {
    expect(check("Fixed a gallery memory leak found with Instruments on Splunk dashboards").violations).toContainEqual({
      type: "term",
      term: "Splunk",
    });
    expect(check("Fixed a memory leak found with Instruments in March").ok).toBe(true);
  });
});

describe("guard with experience context", () => {
  const fact: Fact = { id: "p", experienceId: "club", did: "Wrote a Python script to plot sensor logs for PID tuning", tech: ["Python"] };
  const club = { id: "club", kind: "activity" as const, title: "Firmware lead", org: "KIT Robotics Club" };

  it("accepts names from the bullet's own experience, but not its numbers", () => {
    const text = "Plotted sensor logs for PID tuning with a Python script for the KIT Robotics Club";
    expect(checkBullet({ experienceId: "club", text, factIds: ["p"] }, [fact]).ok).toBe(false);
    expect(checkBullet({ experienceId: "club", text, factIds: ["p"] }, [fact], [club]).ok).toBe(true);
    expect(
      checkBullet({ experienceId: "club", text: `${text}, winning 2 cups`, factIds: ["p"] }, [fact], [club]).ok,
    ).toBe(false);
  });
});

describe("guard: derived numbers, abbreviations, counted nouns", () => {
  const f = (id: string, did: string, result: string | null, tech: string[] = []): Fact => ({
    id,
    experienceId: "e1",
    did,
    result,
    tech,
  });
  const bank = [
    f("w", "Lazy-loaded images on the landing page", "Page weight went from 410 KB to 260 KB"),
    f("m", "Trained a CNN for leaf disease photos", "0.91 accuracy on a held-out test set"),
    f("q", "Built a RAG chatbot over course PDFs", "Answered 78 of 100 test questions correctly"),
    f("r", "Rewrote the report query with an index", "Report time went from 12 minutes to 40 seconds"),
    f("t", "Logged 340 tickets over 8 months", null),
    f("v", "Moved 6 virtual machines to a new host with server-side rendering tests", null, ["Docker"]),
    f("c", "Ran a reading club", "Grew it to 120 members"),
  ];
  const check = (text: string, id: string) => checkBullet({ experienceId: "e1", text, factIds: [id] }, bank);

  it("accepts percentages and ratios the cited fact computes", () => {
    expect(check("Cut landing page weight by 36% by lazy-loading images", "w").ok).toBe(true);
    expect(check("Cut landing page weight by 37% by lazy-loading images", "w").ok).toBe(true);
    expect(check("Reached 91% accuracy on a held-out test set with a CNN", "m").ok).toBe(true);
    expect(check("Built a RAG chatbot that answered 78% of test questions correctly", "q").ok).toBe(true);
    expect(check("Cut report time by 94% by rewriting the query with an index", "r").ok).toBe(true);
    expect(check("Made the report 18x faster by rewriting the query with an index", "r").ok).toBe(true);
  });

  it("blocks percentages and ratios the facts do not compute", () => {
    expect(check("Cut landing page weight by 52% by lazy-loading images", "w").ok).toBe(false);
    expect(check("Halved landing page weight by lazy-loading images", "w").ok).toBe(false);
    expect(check("Reached 97% accuracy on a held-out test set with a CNN", "m").ok).toBe(false);
    expect(check("Cut report time by 97% by rewriting the query with an index", "r").ok).toBe(false);
    // Right arithmetic, wrong subject: the fact never mentions cost.
    expect(check("Rewrote the report query with an index, cutting costs by 94%", "r").ok).toBe(false);
    // 340 and 8 are not a before/after pair.
    expect(check("Logged 340 tickets over 8 months with a 98% ticket resolution rate", "t").ok).toBe(false);
  });

  it("accepts common abbreviations and forms of what the fact says", () => {
    expect(check("Moved 6 VMs to a new host", "v").ok).toBe(true);
    expect(check("Added SSR tests while moving 6 virtual machines", "v").ok).toBe(true);
    expect(check("Moved 6 Dockerized virtual machines to a new host", "v").ok).toBe(true);
    expect(check("Moved 6 VMs to a new host behind a CDN", "v").violations).toContainEqual({ type: "term", term: "CDN" });
    expect(check("Built a Dockerized RAG chatbot over course PDFs", "q").ok).toBe(false);
  });

  it("warns, without blocking, when a number counts something else", () => {
    const r = check("Grew a reading club to 120 bookings", "c");
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([{ type: "counted-noun", claim: "120 bookings", fact: "120 members" }]);
    expect(check("Grew a reading club to 120 active members", "c").warnings).toEqual([]);
  });
});

describe("guard: derived direction, initials, more units", () => {
  const f = (id: string, did: string, result: string | null, tech: string[] = []): Fact => ({
    id,
    experienceId: "e1",
    did,
    result,
    tech,
  });
  const bank = [
    f("cost", "Moved model serving to autoscaling pods", "Monthly inference cost dropped from $5,200 to $3,100"),
    f("seo", "Rewrote page titles for search engine optimisation", "Organic search sessions rose from 2,100 to 3,400 per month"),
    f("q", "Found where new users drop off during onboarding", "1,350 of 4,500 new sign-ups quit at the phone step"),
    f("pos", "Wrote the localization node for Robot Operating System 2", "Position error fell from 25 cm to 8 cm"),
    f("pps", "Reconfigured virtual LANs on 42 access switches", "Broadcast traffic fell from 1,200 packets per second to 300 packets per second"),
    f("dr", "Wrote runbooks for point-in-time recovery", "Used in 2 disaster recovery drills"),
    f("ga", "Set up Google Analytics 4 conversion tracking", "Tracked 1,180 online bookings"),
    f("vm", "Moved 8 always-on virtual machines to pods", null),
  ];
  const check = (text: string, id: string) => checkBullet({ experienceId: "e1", text, factIds: [id] }, bank);

  it("reads a before/after pair in its direction", () => {
    expect(check("Cut monthly inference cost by 40% by moving to autoscaling pods", "cost").ok).toBe(true);
    // 3,100 / 5,200 is 60%, but that is what is left, not the cut.
    expect(check("Cut monthly inference cost by 60% by moving to autoscaling pods", "cost").ok).toBe(false);
    // An increase is measured from the start value: (3,400 - 2,100) / 2,100 = 62%.
    expect(check("Grew organic search sessions 62% by rewriting page titles", "seo").ok).toBe(true);
    expect(check("Grew organic search sessions 38% by rewriting page titles", "seo").ok).toBe(false);
  });

  it("reads X of Y only as X / Y", () => {
    expect(check("Found that 30% of new sign-ups quit at the phone step", "q").ok).toBe(true);
    expect(check("Found that 70% of new sign-ups quit at the phone step", "q").ok).toBe(false);
    // The same number again, about something the fact never mentions.
    expect(check("Found that 30% of new sign-ups quit at the phone step, cutting costs by 30%", "q").ok).toBe(false);
  });

  it("derives percentages on more units and repeated unit phrases", () => {
    expect(check("Cut position error by 68% in a Robot Operating System 2 node", "pos").ok).toBe(true);
    expect(check("Cut broadcast traffic by 75% by reconfiguring virtual LANs", "pps").ok).toBe(true);
    expect(check("Cut broadcast traffic by 25% by reconfiguring virtual LANs", "pps").ok).toBe(false);
  });

  it("accepts an acronym spelled out by the initials of a phrase in the fact", () => {
    expect(check("Wrote PITR runbooks used in 2 DR drills", "dr").ok).toBe(true);
    expect(check("Reconfigured VLANs on 42 access switches", "pps").ok).toBe(true);
    expect(check("Wrote a ROS 2 localization node", "pos").ok).toBe(true);
    expect(check("Set up GA4 conversion tracking for 1,180 online bookings", "ga").ok).toBe(true);
    expect(check("Rewrote page titles for SEO", "seo").ok).toBe(true);
  });

  it("blocks an acronym the facts do not spell out, or that names something else", () => {
    expect(check("Wrote PITR runbooks with RTO targets", "dr").violations).toContainEqual({ type: "term", term: "RTO" });
    expect(check("Reconfigured VLANs over MPLS on 42 access switches", "pps").ok).toBe(false);
    // Listed abbreviations need their own expansion: "VPC" is not "virtual private cloud" here.
    expect(check("Moved 8 VPC hosts to pods", "vm").ok).toBe(false);
    // Tool names stay with the vocabulary: initials never turn "AWS" into "always-on ... ".
    expect(check("Moved 8 AWS virtual machines to pods", "vm").ok).toBe(false);
  });
});

describe("normalizeTag", () => {
  it("keeps known tools by canonical name and drops counts and versions", () => {
    expect(normalizeTag("3 FastAPI services")).toEqual(["FastAPI"]);
    expect(normalizeTag("Next.js 16")).toEqual(["Next.js"]);
    expect(normalizeTag("Python 3.12")).toEqual(["Python"]);
    expect(normalizeTag("Supabase (Postgres)").sort()).toEqual(["PostgreSQL", "Supabase"]);
    expect(normalizeTag("PromptPay QR v2")).toEqual(["PromptPay QR"]);
    expect(normalizeTag("  ")).toEqual([]);
  });
});

describe("matching v2 (requirement matching only)", () => {
  // Fictional facts shaped like a real multi-project profile.
  const profile: Fact[] = [
    { id: "a", experienceId: "e1", did: "Built a RAG study assistant", result: null, tech: ["Gemini", "FastAPI", "Python"] },
    { id: "b", experienceId: "e2", did: "Read bank slips in the browser", result: null, tech: ["tesseract.js", "Next.js"] },
    { id: "c", experienceId: "e3", did: "Containerised the API", result: null, tech: ["Docker"] },
  ];

  it("matches any part of a slash compound and broader words a tool proves", () => {
    const report = matchRequirements(
      {
        role: "Software Development & AI/ML Intern",
        requirements: [
          { name: "AI/RAG/OCR systems", kind: "keyword", importance: "required" },
          { name: "Backend APIs", kind: "keyword", importance: "required" },
          { name: "Web applications", kind: "keyword", importance: "required" },
          { name: "Software development", kind: "keyword", importance: "required" },
          { name: "Artificial intelligence", kind: "keyword", importance: "preferred" },
          { name: "Docker", kind: "skill", importance: "required" },
          { name: "Kubernetes", kind: "skill", importance: "required" },
        ],
        problems: [],
      },
      profile,
    );
    expect(report.matches.map((m) => m.factIds)).toEqual([["a", "b"], ["a"], ["b"], ["a", "b"], ["a"], ["c"], []]);
  });

  it("still needs real evidence", () => {
    expect(backs("Wrote the team newsletter", "AI/RAG/OCR systems")).toBe(false);
    expect(backs("Built a landing page in plain HTML", "Backend APIs")).toBe(false);
    expect(backs("Rebuilt the parcel tracking page in React", "Data pipelines")).toBe(false);
  });

  it("does not change mentions(), which the guard-side eval uses", () => {
    expect(mentions("Built a RAG study assistant with Gemini", "AI/RAG/OCR systems")).toBe(false);
  });
});
