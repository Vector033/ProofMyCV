import { describe, expect, it } from "vitest";
import { finishDraft, finishProfile, parseDates, parseResumeRuleBased } from "./resume";
import { sameEntry } from "./types";

// Fictional resume text; no real person.
const RESUME = `Ploy Sample
ploy@example.com · Chiang Mai

SUMMARY
Third-year student who likes backend work.

Work Experience
Software Engineer Intern — Example Logistics Co., Ltd.
Bangkok · June 2025 - Present
● Moved nightly reports from cron scripts to GitHub Actions, cutting failed runs
from 12 a month to 2
● Wrote Playwright tests for the checkout flow

Teaching Assistant at Example University  08/2024 – 05/2025
- Ran weekly labs for 60 students in Data Structures

SKILLS
Python, Go, Docker

Education
B.Sc. Computer Science
Example University 2023 – 2027
`;

describe("parseDates", () => {
  it("reads month names, numeric months and Present", () => {
    expect(parseDates("June 2025 - Present")).toMatchObject({ start: "2025-06", end: null, found: true });
    expect(parseDates("TA 08/2024 – 05/2025")).toMatchObject({ start: "2024-08", end: "2025-05", rest: "TA" });
    expect(parseDates("Sept. 2024 to Jan 2025")).toMatchObject({ start: "2024-09", end: "2025-01" });
  });

  it("keeps a bare year as a year (no made-up month), and ignores other 4-digit numbers", () => {
    expect(parseDates("2023 – 2027")).toMatchObject({ start: "2023", end: "2027", found: true, rest: "" });
    expect(parseDates("Served 1200 users")).toMatchObject({ found: false });
  });
});

describe("parseResumeRuleBased", () => {
  const { profile, experiences: draft } = parseResumeRuleBased(RESUME);

  it("reads the header block into the profile", () => {
    expect(profile).toEqual({ fullName: "Ploy Sample", headline: "", contact: "ploy@example.com \u00B7 Chiang Mai", links: "" });
  });

  it("skips the contact block, summary and skills", () => {
    expect(draft.map((e) => e.title)).toEqual(["Software Engineer Intern", "Teaching Assistant", "B.Sc. Computer Science"]);
  });

  it("splits header lines into title, organisation and dates", () => {
    expect(draft[0]).toMatchObject({ kind: "job", org: "Example Logistics Co., Ltd.", startDate: "2025-06", endDate: null });
    expect(draft[1]).toMatchObject({ org: "Example University", startDate: "2024-08", endDate: "2025-05" });
    expect(draft[2]).toMatchObject({ kind: "education", org: "Example University", startDate: "2023", endDate: "2027", facts: [] });
  });

  it("turns bullets into facts and joins wrapped lines", () => {
    expect(draft[0].facts).toEqual([
      { did: "Moved nightly reports from cron scripts to GitHub Actions, cutting failed runs from 12 a month to 2", result: null, tech: ["GitHub Actions"] },
      { did: "Wrote Playwright tests for the checkout flow", result: null, tech: ["Playwright"] },
    ]);
    expect(draft[1].facts[0].did).toBe("Ran weekly labs for 60 students in Data Structures");
  });

  it("returns nothing for text without sections or bullets", () => {
    expect(parseResumeRuleBased("Just a name\nand an email").experiences).toEqual([]);
  });
});

// Fictional resume with a full header, a project stack line and degree details.
const RESUME_V2 = `SOMCHAI EXAMPLE
Computer Science Student
somchai@example.com | 081-234-5678 | Chiang Mai
github.com/somchai-example \u00B7 somchai.dev

Projects
Slip reader
Tech: Next.js 16, tesseract.js, Supabase (Postgres)
- Read bank slips in the browser
- Matched each slip to a trip expense

Education
B.Sc. Computer Science, Example University
2024 - Present
GPAX: 2.92
Coursework: OOP, AI
`;

describe("resume import v2", () => {
  const { profile, experiences } = parseResumeRuleBased(RESUME_V2);

  it("fills the whole header and title-cases an all-caps name", () => {
    expect(profile).toEqual({
      fullName: "Somchai Example",
      headline: "Computer Science Student",
      contact: "somchai@example.com \u00B7 081-234-5678 \u00B7 Chiang Mai",
      links: "github.com/somchai-example \u00B7 somchai.dev",
    });
  });

  it("gives the project's stack line to every fact, cleaned", () => {
    const stack = ["Next.js", "tesseract.js", "PostgreSQL", "Supabase"];
    expect(experiences[0].facts.map((f) => f.tech)).toEqual([stack, stack]);
  });

  it("keeps GPAX and coursework as facts of the degree, with a year-only start", () => {
    expect(experiences[1]).toMatchObject({ kind: "education", title: "B.Sc. Computer Science", startDate: "2024", endDate: null });
    expect(experiences[1].facts.map((f) => f.did)).toEqual(["GPAX: 2.92", "Coursework: OOP, AI"]);
  });

  it("keeps only header text the file contains, without unprintable marks", () => {
    expect(
      finishProfile(
        { fullName: "\u0E4CSomchai Example", headline: "Senior Engineer", contact: "somchai@example.com \u00B7 099-999-9999", links: "https://github.com/somchai-example" },
        RESUME_V2,
      ),
    ).toEqual({ fullName: "Somchai Example", headline: "", contact: "somchai@example.com", links: "https://github.com/somchai-example" });
  });
});

describe("finishDraft", () => {
  it("flags numbers the file does not contain and drops tech it never names", () => {
    const [e] = finishDraft(
      [
        {
          kind: "job",
          title: "Intern",
          org: "",
          startDate: null,
          endDate: null,
          facts: [{ did: "Ran labs for 60 students", result: "Pass rate rose 15%", tech: ["kubernetes", "Data Structures", "python"] }],
        },
      ],
      "Ran labs for 60 students in Data Structures using Python",
    );
    expect(e.facts[0]).toEqual({
      did: "Ran labs for 60 students",
      result: "Pass rate rose 15%",
      tech: ["Data Structures", "Python"],
      unverified: ["15%"],
    });
  });
});

describe("import fixes from a real-resume trial", () => {
  it("finds an entry already in the bank by its name, not its exact title", () => {
    const project = (title: string, org = "") => ({ kind: "project" as const, title, org });
    expect(sameEntry(project("MorPlan"), project("MorPlan \u2014 AI trip planner", "Personal"))).toBe(true);
    expect(sameEntry(project("Project Z (team of 6)"), project("Project Z: course project"))).toBe(true);
    expect(sameEntry(project("MorPlan"), project("PingKhana"))).toBe(false);
    expect(sameEntry(project("MorPlan"), { kind: "job", title: "MorPlan", org: "" })).toBe(false);
    const job = (title: string, org: string) => ({ kind: "job" as const, title, org });
    expect(sameEntry(job("Software Intern - Backend", "Example Co."), job("Software Intern", "example co"))).toBe(true);
    expect(sameEntry(job("Software Intern", "Example Co."), job("Software Intern", "Other Co."))).toBe(false);
    const degree = (title: string) => ({ kind: "education" as const, title, org: "Example University" });
    expect(sameEntry(degree("B.S. in Computer Science (Year 3)"), degree("Bachelor of Science in Computer Science"))).toBe(true);
  });

  it("keeps an outcome sentence as the result of the fact before it", () => {
    const text = "Built a scraper for school news. 352 announcements gathered so far. Wrote a guard. It blocked 9 of 10.";
    const [e] = finishDraft(
      [{
        kind: "project", title: "Reader", org: "", startDate: null, endDate: null,
        facts: [
          { did: "Built a scraper for school news", result: null, tech: [] },
          { did: "352 announcements gathered so far", result: null, tech: [] },
          { did: "Wrote a guard", result: null, tech: [] },
          { did: "It blocked 9 of 10", result: null, tech: [] },
          { did: "10 more checks added", result: null, tech: [] },
        ],
      }],
      text,
    );
    expect(e.facts.map((f) => [f.did, f.result])).toEqual([
      ["Built a scraper for school news", "352 announcements gathered so far"],
      ["Wrote a guard", "It blocked 9 of 10"],
      ["10 more checks added", null],
    ]);
  });

  it("title-cases an all-caps headline but keeps acronyms", () => {
    const head = "FULL-STACK DEVELOPER \u2014 AI TOOLS, JUN\u2013OCT 2027";
    expect(finishProfile({ fullName: "", headline: head, contact: "", links: "" }, head).headline).toBe(
      "Full-Stack Developer \u2014 AI Tools, Jun\u2013Oct 2027",
    );
  });
});
