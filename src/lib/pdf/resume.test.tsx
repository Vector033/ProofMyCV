import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument, orderedSkills, type ResumeData } from "./resume";

const data: ResumeData = {
  profile: { fullName: "Alex Demo", headline: "CS student", contact: "demo@proofmycv.test", links: "github.com/alexdemo" },
  experiences: [
    { id: "e1", kind: "job", title: "Intern", org: "Lanna Logistics", startDate: "2026-06", endDate: "2026-08" },
    { id: "e2", kind: "project", title: "Unused project", org: "", startDate: null, endDate: null },
    { id: "e3", kind: "education", title: "B.Sc. Computer Science", org: "Example University", startDate: "2024-06", endDate: null },
  ],
  facts: [
    { id: "f1", experienceId: "e1", did: "Rebuilt the tracking page", result: "4.1 s to 1.3 s", tech: ["React", "Docker"] },
    { id: "f2", experienceId: "e2", did: "Wrote a game", tech: ["Lua"] },
  ],
  bullets: [{ experienceId: "e1", text: "Cut page load from 4.1 s to 1.3 s by rebuilding it in React", factIds: ["f1"] }],
  analysis: {
    role: "Developer",
    requirements: [
      { name: "Docker", kind: "skill", importance: "preferred" },
      { name: "React", kind: "skill", importance: "required" },
    ],
    problems: [],
  },
};

describe("resume PDF", () => {
  it("renders a small PDF", async () => {
    const pdf = await renderToBuffer(<ResumeDocument data={data} />);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeLessThan(2.5 * 1024 * 1024);
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, pdf);
  });

  it("cleans and de-duplicates tags before the skills cut", () => {
    const facts = [
      { id: "x", experienceId: "e1", did: "a", result: null, tech: ["Next.js 16", "3 FastAPI services", "Supabase (Postgres)"] },
      { id: "y", experienceId: "e1", did: "b", result: null, tech: ["supabase", "FastAPI", "Python 3.12"] },
    ];
    expect(orderedSkills(facts, { ...data.analysis, requirements: [] })).toEqual(["Next.js", "FastAPI", "PostgreSQL", "Supabase", "Python"]);
  });

  it("lists skills the job requires first", () => {
    expect(orderedSkills(data.facts, data.analysis)).toEqual(["React", "Docker", "Lua"]);
  });
});
