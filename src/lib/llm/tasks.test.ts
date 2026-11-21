import { describe, expect, it } from "vitest";
import type { LlmProvider } from "./provider";
import { parseResume } from "./tasks";

const fake = (reply: unknown): LlmProvider => ({
  name: "fake",
  json: async ({ schema }) => schema.parse(reply),
});

describe("parseResume", () => {
  it("uses the rule-based parser without an LLM", async () => {
    expect((await parseResume(null, "Projects\nChess bot\n- Wrote it in Rust")).experiences).toEqual([
      { kind: "project", title: "Chess bot", org: "", startDate: null, endDate: null, facts: [{ did: "Wrote it in Rust", result: null, tech: ["Rust"] }] },
    ]);
  });

  it("keeps the model's draft but flags invented numbers and drops invalid or invented dates", async () => {
    const text = "Experience\nBarista, Example Cafe\nJun 2024 - Present\n- Trained 4 new staff\nEducation\nB.A. Example University 2020 – 2024";
    const draft = await parseResume(
      fake({
        profile: { fullName: "", headline: "", contact: "", links: "" },
        experiences: [
          {
            kind: "job",
            title: "Barista",
            org: "Example Cafe",
            startDate: "2024-06",
            endDate: "2024-13",
            tech: [],
            facts: [{ did: "Trained 4 new staff", result: "Cut waiting time by 30%", tech: ["Excel"] }],
          },
          { kind: "education", title: "B.A.", org: "Example University", startDate: "2020-01", endDate: "2024-12", tech: [], facts: [] },
        ],
      }),
      text,
    );
    expect(draft.experiences).toEqual([
      {
        kind: "job",
        title: "Barista",
        org: "Example Cafe",
        startDate: "2024-06",
        endDate: null,
        facts: [{ did: "Trained 4 new staff", result: "Cut waiting time by 30%", tech: [], unverified: ["30%"] }],
      },
      // The file gives only years, so the model's months are dropped.
      { kind: "education", title: "B.A.", org: "Example University", startDate: null, endDate: null, facts: [] },
    ]);
  });
});
