// Creates a demo account with a fictional fact bank on the LOCAL Supabase stack,
// for screenshots and manual testing. Run: npm run seed:demo
// The person below is made up; never seed real resume data.

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

export const DEMO_EMAIL = "demo@factfit.test";
export const DEMO_PASSWORD = "factfit-demo-2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!/127\.0\.0\.1|localhost/.test(url)) throw new Error("seed-demo only runs against local Supabase");

const admin = createClient(url, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const bank = [
  {
    kind: "job",
    title: "Software Engineering Intern",
    org: "Lanna Logistics",
    location: "Chiang Mai",
    start: "2026-06",
    end: "2026-08",
    facts: [
      { did: "Rebuilt the parcel tracking page in React and TypeScript", result: "Page load went from 4.1 s to 1.3 s", tech: ["React", "TypeScript"] },
      { did: "Added a PostgreSQL index and rewrote 2 slow reporting queries", result: "Daily report job dropped from 25 minutes to 3 minutes", tech: ["PostgreSQL", "SQL"] },
      { did: "Wrote Jest tests for the shipping-rate calculator", result: "Caught 6 pricing bugs before release", tech: ["Jest", "TypeScript"] },
    ],
  },
  {
    kind: "project",
    title: "StudyBuddy, course Q&A bot",
    org: "Personal project",
    start: "2025-11",
    end: "2026-02",
    facts: [
      { did: "Built a FastAPI backend that answers questions from course slides with Gemini", result: "Used by 120 classmates during finals", tech: ["Python", "FastAPI", "Gemini"] },
      { did: "Containerised the API with Docker and deployed it with GitHub Actions", tech: ["Docker", "GitHub Actions"] },
    ],
  },
  {
    kind: "education",
    title: "B.Sc. Computer Science",
    org: "Example University",
    start: "2024-06",
    end: "2028-05",
    facts: [{ did: "GPA 3.52, Data Structures and Databases teaching assistant", tech: [] }],
  },
];

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }
  const userId = user.id;

  await sql`delete from experiences where user_id = ${userId}`;
  await sql`
    insert into profiles (user_id, full_name, headline, contact, links)
    values (${userId}, 'Alex Demo', 'Computer Science student', 'demo@factfit.test · Chiang Mai', 'github.com/alexdemo')
    on conflict (user_id) do update set full_name = excluded.full_name, headline = excluded.headline,
      contact = excluded.contact, links = excluded.links`;

  for (const [i, e] of bank.entries()) {
    const [row] = await sql`
      insert into experiences (user_id, kind, title, org, location, start_date, end_date, sort)
      values (${userId}, ${e.kind}, ${e.title}, ${e.org}, ${e.location ?? null}, ${e.start}, ${e.end}, ${i})
      returning id`;
    for (const f of e.facts) {
      await sql`
        insert into facts (user_id, experience_id, did, result, tech)
        values (${userId}, ${row.id}, ${f.did}, ${f.result ?? null}, ${f.tech})`;
    }
  }
  console.log(`Seeded ${DEMO_EMAIL} (password in scripts/seed-demo.ts)`);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
