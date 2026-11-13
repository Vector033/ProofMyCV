// Offline eval: runs in CI with no API key. Scores the fabrication guard on
// hand-written and generated fabrications, and the rule-based skill extractor
// on the hand labels. `npm run eval` prints the full report.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractJobRuleBased } from "@/lib/core/jd";
import { evaluateGuard, loadCases, pct, scoreExtraction, sumExtraction } from "./metrics";

const cases = loadCases();
const verbose = process.env.npm_lifecycle_event === "eval";

describe("eval set", () => {
  it("has at least 30 cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
  });

  it("guard blocks every fabrication and accepts faithful bullets", () => {
    const r = evaluateGuard(cases);
    if (verbose) {
      console.log(
        `Guard: blocked ${r.fabricated.blocked}/${r.fabricated.total} fabrications (${pct(r.fabricated.blocked / r.fabricated.total)}), ` +
          `accepted ${r.gold.accepted}/${r.gold.total} faithful bullets (${pct(r.gold.accepted / r.gold.total)})`,
      );
      for (const [k, v] of Object.entries(r.fabricated.byKind)) console.log(`  ${k}: ${v.blocked}/${v.total}`);
      for (const m of r.fabricated.missed) console.log(`  MISSED [${m.caseId} ${m.source} ${m.kind}]${m.warned ? " (warned)" : ""} ${m.text}`);
      for (const g of r.gold.rejected) console.log(`  REJECTED GOLD [${g.caseId}] ${g.text} <- ${g.why.join(", ")}`);
      console.log(`  counted-noun warnings on faithful bullets: ${r.gold.warned.length}/${r.gold.accepted}`);
      for (const g of r.gold.warned) console.log(`  WARNED GOLD [${g.caseId}] ${g.text}`);
    }
    expect(r.fabricated.missed).toEqual([]);
    expect(r.gold.accepted / r.gold.total).toBeGreaterThanOrEqual(GOLD_ACCEPTANCE_FLOOR);
  });

  it("rule-based extractor finds the labelled skills", () => {
    const s = sumExtraction(cases.map((c) => scoreExtraction(c, extractJobRuleBased(c.jd))));
    if (verbose) {
      console.log(`Rules extraction: required recall ${pct(s.requiredRecall)}, recall ${pct(s.recall)}, precision ${pct(s.precision)}`);
    }
    expect(s.requiredRecall).toBeGreaterThanOrEqual(RULES_REQUIRED_RECALL_FLOOR);
  });
});

// Held-out sets were written by a separate author after the guard was tuned on
// eval/cases and were never used to change it. Their score is reported, not tuned
// against. holdout/ was scored on 2026-11-04 and is no longer blind; holdout2/ was
// written blind on 2026-11-14 and scored once with the guard frozen.
for (const name of ["holdout", "holdout2"]) {
  const dir = join(process.cwd(), "eval", name);
  describe.runIf(existsSync(dir))(`held-out set ${name}`, () => {
    it("reports guard and extractor scores", () => {
      const held = loadCases(dir);
      const r = evaluateGuard(held);
      const s = sumExtraction(held.map((c) => scoreExtraction(c, extractJobRuleBased(c.jd))));
      const tag = name.toUpperCase();
      if (verbose) {
        console.log(
          `${tag} (${held.length} cases) Guard: blocked ${r.fabricated.blocked}/${r.fabricated.total} (${pct(r.fabricated.blocked / r.fabricated.total)}), ` +
            `accepted ${r.gold.accepted}/${r.gold.total} faithful (${pct(r.gold.accepted / r.gold.total)}); ` +
            `rules required recall ${pct(s.requiredRecall)}`,
        );
        for (const [k, v] of Object.entries(r.fabricated.byKind)) console.log(`  ${name} ${k}: ${v.blocked}/${v.total}`);
        for (const m of r.fabricated.missed) console.log(`  ${tag} MISSED [${m.caseId} ${m.source} ${m.kind}]${m.warned ? " (warned)" : ""} ${m.text}`);
        for (const g of r.gold.rejected) console.log(`  ${tag} REJECTED GOLD [${g.caseId}] ${g.text} <- ${g.why.join(", ")}`);
        console.log(`  ${name} counted-noun warnings on faithful bullets: ${r.gold.warned.length}/${r.gold.accepted}`);
        for (const g of r.gold.warned) console.log(`  ${tag} WARNED GOLD [${g.caseId}] ${g.text}`);
      }
      expect(r.gold.accepted / r.gold.total).toBeGreaterThanOrEqual(HOLDOUT_GOLD_FLOOR[name]);
    });
  });
}

// Floors are set from measured results so a regression fails CI; raise them as
// the guard and extractor improve.
const GOLD_ACCEPTANCE_FLOOR = 0.95;
// Held-out sets are reported, not tuned: these floors pin the scores measured with
// the guard frozen (holdout2: 16/30 on 2026-11-14), so only a regression fails CI.
const HOLDOUT_GOLD_FLOOR: Record<string, number> = { holdout: 0.95, holdout2: 0.5 };
const RULES_REQUIRED_RECALL_FLOOR = 0.7;
