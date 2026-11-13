import { describe, expect, it } from "vitest";
import { DEMO_DRAFTS, demoCheck, demoClaims, violationTerms } from "./demo-drafts";

// The landing page and /login show these verdicts. They must be the real guard's.
describe("demo drafts get the verdict the site shows", () => {
  it("blocks the invented drafts for the reasons shown", () => {
    expect(violationTerms(DEMO_DRAFTS.invented).sort()).toEqual(["$40K", "45%", "Redis"]);
    expect(violationTerms(DEMO_DRAFTS.inventedTool)).toEqual(["Kafka"]);
    expect(violationTerms(DEMO_DRAFTS.inventedShort).sort()).toEqual(["90%", "Redis"]);
  });

  it("accepts the faithful drafts with no warnings", () => {
    for (const text of [DEMO_DRAFTS.faithful, DEMO_DRAFTS.faithfulShort]) {
      expect(demoCheck(text)).toEqual({ ok: true, violations: [], warnings: [] });
    }
    expect(demoClaims(DEMO_DRAFTS.faithful)).toEqual(["25 minutes", "3 minutes", "2", "PostgreSQL"]);
    expect(demoClaims(DEMO_DRAFTS.faithfulShort)).toEqual(["25", "3 minutes", "PostgreSQL"]);
  });
});
