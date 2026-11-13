import { describe, expect, it } from "vitest";
import { finishDraft, parseDates, parseResumeRuleBased } from "./resume";

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

  it("never makes up a month for a bare year, and ignores other 4-digit numbers", () => {
    expect(parseDates("2023 – 2027")).toMatchObject({ start: null, end: null, found: true, rest: "" });
    expect(parseDates("Served 1200 users")).toMatchObject({ found: false });
  });
});

describe("parseResumeRuleBased", () => {
  const draft = parseResumeRuleBased(RESUME);

  it("skips the contact block, summary and skills", () => {
    expect(draft.map((e) => e.title)).toEqual(["Software Engineer Intern", "Teaching Assistant", "B.Sc. Computer Science"]);
  });

  it("splits header lines into title, organisation and dates", () => {
    expect(draft[0]).toMatchObject({ kind: "job", org: "Example Logistics Co., Ltd.", startDate: "2025-06", endDate: null });
    expect(draft[1]).toMatchObject({ org: "Example University", startDate: "2024-08", endDate: "2025-05" });
    expect(draft[2]).toMatchObject({ kind: "education", org: "Example University", facts: [] });
  });

  it("turns bullets into facts and joins wrapped lines", () => {
    expect(draft[0].facts).toEqual([
      { did: "Moved nightly reports from cron scripts to GitHub Actions, cutting failed runs from 12 a month to 2", result: null, tech: ["GitHub Actions"] },
      { did: "Wrote Playwright tests for the checkout flow", result: null, tech: ["Playwright"] },
    ]);
    expect(draft[1].facts[0].did).toBe("Ran weekly labs for 60 students in Data Structures");
  });

  it("returns nothing for text without sections or bullets", () => {
    expect(parseResumeRuleBased("Just a name\nand an email")).toEqual([]);
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
