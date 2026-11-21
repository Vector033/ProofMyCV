import { describe, expect, it } from "vitest";
import { dependencyNames, parseRepo } from "./github";
import { draftFromRepo } from "../llm/tasks";

describe("parseRepo", () => {
  it("accepts the usual ways of writing a repository", () => {
    for (const s of [
      "github.com/octo-cat/my_app",
      "https://github.com/octo-cat/my_app",
      "https://www.github.com/octo-cat/my_app.git",
      "octo-cat/my_app",
      "https://github.com/octo-cat/my_app/tree/main/src",
    ]) {
      expect(parseRepo(s), s).toEqual({ owner: "octo-cat", repo: "my_app" });
    }
  });
  it("rejects anything that could reach another host or path", () => {
    for (const s of ["", "octo-cat", "https://gitlab.com/a/b", "../../etc/passwd", "a/..", "-bad/repo", "evil.com/a/b"]) {
      expect(parseRepo(s), s).toBeNull();
    }
  });
});

describe("dependencyNames", () => {
  it("reads package.json and requirements.txt", () => {
    const pkg = JSON.stringify({ dependencies: { next: "16" }, devDependencies: { vitest: "4" } });
    const reqs = ["fastapi==0.110", "# comment", "pydantic>=2"].join("\n");
    expect(dependencyNames(pkg, reqs)).toEqual(["next", "vitest", "fastapi", "pydantic"]);
    expect(dependencyNames("not json", null)).toEqual([]);
  });
});

describe("draftFromRepo (rules)", () => {
  it("proposes one project from README list items and the stack, nothing invented", async () => {
    const readme = [
      "# Slip reader",
      "",
      "## Features",
      "- Reads Thai bank slips in the browser with OCR",
      "- Matches each slip to a trip expense",
      "- npm install then npm run dev",
      "- [Docs](https://example.com)",
    ].join("\n");
    const draft = await draftFromRepo(null, {
      name: "slip-reader",
      description: "Reads bank slips in the browser",
      readme,
      dependencies: ["next", "react", "tesseract.js", "vitest"],
    });
    expect(draft.experiences).toHaveLength(1);
    const [p] = draft.experiences;
    expect(p).toMatchObject({ kind: "project", title: "slip-reader" });
    expect(p.facts.map((f) => f.did)).toEqual(["Reads Thai bank slips in the browser with OCR", "Matches each slip to a trip expense"]);
    expect(p.facts[0].tech).toEqual(expect.arrayContaining(["Next.js", "React", "Vitest"]));
  });
});
