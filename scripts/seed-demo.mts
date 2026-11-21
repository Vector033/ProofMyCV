// Creates (or resets) the demo account with the fictional fact bank in
// src/lib/demo-data.ts. Run: npm run seed:demo
// Local by default. For the hosted project pass --remote and an env file:
//   npx tsx --env-file=<prod env file> scripts/seed-demo.mts --remote

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { extractJobRuleBased } from "../src/lib/core/jd";
import { DEMO_BANK, DEMO_JOB, DEMO_PROFILE } from "../src/lib/demo-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/127\.0\.0\.1|localhost/.test(url) && !process.argv.includes("--remote")) {
  throw new Error("Not a local Supabase URL; pass --remote to seed the hosted project on purpose.");
}
// Local defaults so `npm run seed:demo` works without extra env.
const email = process.env.DEMO_EMAIL ?? "demo@proofmycv.test";
const password = process.env.DEMO_PASSWORD ?? "factfit-demo-2026";

const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const sql = postgres(process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL!, { prepare: false, max: 1 });

async function findUser() {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit || data.users.length < 200) return hit;
  }
}

async function main() {
  let user = await findUser();
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const id = user.id;

  await sql.begin(async (tx) => {
    await tx`delete from factfit.applications where user_id = ${id}`;
    await tx`delete from factfit.experiences where user_id = ${id}`;
    await tx`delete from factfit.profiles where user_id = ${id}`;
    await tx`insert into factfit.profiles (user_id, full_name, headline, contact, links)
      values (${id}, ${DEMO_PROFILE.fullName}, ${DEMO_PROFILE.headline}, ${DEMO_PROFILE.contact}, ${DEMO_PROFILE.links})`;
    for (const [i, e] of DEMO_BANK.entries()) {
      const [row] = await tx`
        insert into factfit.experiences (user_id, kind, title, org, location, start_date, end_date, sort)
        values (${id}, ${e.kind}, ${e.title}, ${e.org}, ${e.location ?? null}, ${e.start}, ${e.end}, ${i})
        returning id`;
      for (const f of e.facts) {
        await tx`insert into factfit.facts (user_id, experience_id, did, result, tech)
          values (${id}, ${row.id}, ${f.did}, ${f.result ?? null}, ${f.tech})`;
      }
    }
    await tx`insert into factfit.applications (user_id, company, role, jd_text, analysis, analyzed_by)
      values (${id}, ${DEMO_JOB.company}, ${DEMO_JOB.role}, ${DEMO_JOB.jdText}, ${tx.json(extractJobRuleBased(DEMO_JOB.jdText))}, 'rules')`;
  });
  console.log(`Seeded the demo account ${email}`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
