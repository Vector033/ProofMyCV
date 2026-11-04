// Schema check for eval case files: npx tsx eval/validate.ts eval/cases/*.json
import { readFileSync } from "node:fs";
import { z } from "zod";
import { evalCaseSchema } from "./schema";

let failed = false;
const ids = new Set<string>();
for (const file of process.argv.slice(2)) {
  const parsed = z.array(evalCaseSchema).safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!parsed.success) {
    failed = true;
    console.error(`${file}:\n${z.prettifyError(parsed.error)}`);
    continue;
  }
  for (const c of parsed.data) {
    if (ids.has(c.id)) {
      failed = true;
      console.error(`${file}: duplicate case id ${c.id}`);
    }
    ids.add(c.id);
  }
  console.log(`${file}: ${parsed.data.length} cases OK`);
}
process.exit(failed ? 1 : 0);
