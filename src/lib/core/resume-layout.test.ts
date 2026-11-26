import { describe, expect, it } from "vitest";
import { bulletsEqual } from "./bullets";
import { orderedResumeSections, parseProfileLinks } from "./resume-layout";

describe("bulletsEqual", () => {
  const base = [{ experienceId: "e1", text: "Built REST API in FastAPI", factIds: ["f1"] }];

  it("treats identical bullet snapshots as equal", () => {
    expect(bulletsEqual(base, [{ experienceId: "e1", text: "Built REST API in FastAPI", factIds: ["f1"] }])).toBe(true);
  });

  it("detects edits and returns to equal when reverted to exact original text", () => {
    const edited = [{ experienceId: "e1", text: "Built REST API in FastAPI for 120 users", factIds: ["f1"] }];
    expect(bulletsEqual(edited, base)).toBe(false);
    const reverted = [{ experienceId: "e1", text: "Built REST API in FastAPI", factIds: ["f1"] }];
    expect(bulletsEqual(reverted, base)).toBe(true);
  });

  it("detects reordering and citation changes", () => {
    const two = [
      { experienceId: "e1", text: "First", factIds: ["f1"] },
      { experienceId: "e1", text: "Second", factIds: ["f2"] },
    ];
    expect(bulletsEqual(two, [two[1], two[0]])).toBe(false);
    expect(bulletsEqual(base, [{ experienceId: "e1", text: "Built REST API in FastAPI", factIds: ["f1", "f2"] }])).toBe(false);
  });
});

describe("resume layout helpers", () => {
  it("moves education first when toggled", () => {
    expect(orderedResumeSections(false).map((s) => s.kind)).toEqual(["job", "project", "education", "activity"]);
    expect(orderedResumeSections(true).map((s) => s.kind)).toEqual(["education", "job", "project", "activity"]);
  });

  it("splits profile links across common separators", () => {
    expect(parseProfileLinks("github.com/alexdemo · alex.dev | linkedin.com/in/alex")).toEqual([
      "github.com/alexdemo",
      "alex.dev",
      "linkedin.com/in/alex",
    ]);
  });
});
