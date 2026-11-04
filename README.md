# FactFit

Tailor your resume to each job description without inventing a single fact.

AI resume writers happily make up numbers and tools. FactFit keeps a **fact bank** of what you actually did, maps a
job description against it, and only lets a bullet onto your resume if every number and every technology in it can be
traced back to a fact you wrote. That check is plain code, not a prompt.

> Status: early development (milestones 1–2 done locally, see [Roadmap](#roadmap)). No live deployment yet.

## How it works

1. **Fact bank.** Per job, project or degree you write short facts: what you did, the result, the number, the tools.
2. **Paste a job description.** FactFit extracts the skills, keywords and problems (Gemini with a JSON schema, or a
   built-in rule-based extractor when no API key is set).
3. **Mapping and fit score.** Each requirement shows the facts that back it, or is listed as missing. The score is
   weighted (required ×3, nice-to-have ×1).
4. **Bullets.** Start from your facts as written or let the LLM draft XYZ-style bullets ("accomplished X, measured by
   Y, by doing Z"). Each draft cites fact ids. The **fabrication guard** blocks any bullet that
   - cites no fact, or a fact that does not exist,
   - contains a number not in the cited facts (units count: a fact's "30 ms" never backs "30%"; "doubled" needs evidence),
   - names a technology or tool-like term (`GraphQL`, `SQS`, `EC2`) not in the cited facts. A specific tool backs
     the broader practice ("Jest" backs "automated testing", "GitHub Actions" backs "CI/CD"), never the reverse.

   The guard runs live in the browser while you edit and again on the server when you save.
5. **Export.** A single-column, text-only A4 PDF (standard fonts, selectable text, a few KB) that ATS parsers read
   top to bottom.

## Eval

40 fictional cases (30 for tuning, 10 held out), details in [eval/README.md](eval/README.md):

- The guard blocked **100%** of 547 fabrications on the tuning set and **96.8%** of 186 on the held-out set,
  while accepting every faithful bullet (120 / 120). Its misses are same-number meaning swaps ("120 members" →
  "120 bookings").
- Gemini Flash-Lite drafted 113 bullets on 28 cases with **0** fabrications found by the guard, an independent
  bait check, or a manual spot check.
- A rewritten drafting prompt raised XYZ-style bullets from 31.6% to 75% (human-written: 86.7%) and cut
  copy-the-fact bullets from 66% to 6%, still with no fabrications.
- Gemini skill extraction recall on required skills: 82.8% (rule-based fallback: 70.5%).

Each job gets its own saved version. You can download everything as JSON or delete your account, which cascades to all
of your data.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Supabase Auth + Postgres · Drizzle ORM ·
Gemini behind a provider interface (`src/lib/llm/provider.ts`) · `@react-pdf/renderer` · Vitest · GitHub Actions.

```
src/lib/core/      pure logic, no I/O: vocabulary, guard, JD extraction, matching (unit tested)
src/lib/llm/       provider adapter + prompts with zod schemas
src/lib/data.ts    data access layer; every query is scoped to the signed-in user
src/lib/pdf/       resume PDF document
src/app/app/       authenticated app (fact bank, applications, settings)
src/proxy.ts       session refresh + optimistic redirect to /login
drizzle/           SQL migrations (RLS enabled, no public policies)
```

## Run locally

Needs Node 24+ and Docker Desktop.

```bash
npm install
npx supabase start          # local Postgres + Auth in Docker; prints the keys
cp .env.example .env.local  # fill in the publishable and secret keys it printed
npm run db:migrate
npm run seed:demo           # optional: a fictional demo account (credentials in scripts/seed-demo.mts)
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local` to enable LLM job analysis and bullet drafting. Without it the rule-based
extractor is used and bullets come from your facts as written. `GEMINI_MODEL` is a comma-separated fallback chain
(default `gemini-flash-lite-latest,gemini-flash-latest`): overloads and rate limits are retried with backoff, and a
model that times out hands over to the next one.

```bash
npm test          # unit tests + offline eval
npm run test:live # calls the real Gemini API with .env.local (opt-in, never runs in CI)
npm run lint
npm run typecheck
```

## Roadmap

- [x] Scaffold, Supabase auth, fact bank schema and CRUD
- [x] JD extraction, mapping page, fit score
- [x] Bullet drafting with the fabrication guard, saved versions, PDF export, data export and account deletion
- [x] Eval set: 30 tuning + 10 held-out cases measuring guard catch rate, false blocks, keyword recall and bullet length
- [ ] Import facts from an existing resume (.docx / .pdf) for review
- [ ] Deploy (Vercel + Supabase) and screenshots
