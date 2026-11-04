// Style scores for a saved live-eval results file: npx tsx eval/style-report.mts [file]
// Defaults to the newest eval/results/live-*.json.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCases, pct } from "./metrics";
import { checkStyle, summariseStyle } from "./style";

type Saved = { results: { id: string; drafts: { text: string; factIds: string[] }[] }[] };

const dir = join(process.cwd(), "eval", "results");
const file = process.argv[2] ?? join(dir, readdirSync(dir).filter((f) => f.startsWith("live-")).sort().at(-1)!);
const { results } = JSON.parse(readFileSync(file, "utf8")) as Saved;
const cases = new Map(loadCases().map((c) => [c.id, c]));

const checks = results.flatMap((r) =>
  r.drafts.map((d) => checkStyle(d.text, cases.get(r.id)!.facts.filter((f) => d.factIds.includes(f.id)))),
);
const s = summariseStyle(checks);
console.log(`${file}
bullets ${s.bullets} | XYZ shape ${pct(s.xyzShape)} | strong verb ${pct(s.strongVerb)} | uses the metric ${pct(s.usesMetric)} | says how ${pct(s.hasHow)} | tool-list tail ${pct(s.toolTail)} | copies a fact ${pct(s.copiesFact)} | mean words ${s.meanWords.toFixed(1)}`);
