# FactFit handoff (updated 2026-11-13)

Read this first, then `CLAUDE.md` (status line + rules) and `README.md`. Answer the user in **Thai**; keep code,
commits and UI copy in English.

## How to work in a new session

- **Token budget:** turn on `ponytail` (smallest complete change); `caveman` if the user wants short replies.
  Keep chat short; put detail in files.
- **Design work:** `CLAUDE_DESIGN_GUIDE.md` is the spec (trimmed to rules on 2026-11-14; the long study notes are in git history). Its honesty rules come first.
  Useful skills: `no-ai-design-slop` / `audit-ai-design-slop`, `better-interface`, `break-ui`, `animate`.
  Run heavy review skills in a subagent and keep only the ranked findings.
- **Rules (from CLAUDE.md):** ask before every push or deploy. Never invent resume or portfolio facts.
  Deploy with `npx vercel@latest deploy --prod --yes`.

## Where things stand

- **Live:** https://factfit-five.vercel.app. Repo github.com/Vector033/FactFit (private).
  `main` = `eb99489`, pushed and deployed on 2026-11-21 (fixes from the owner's real-resume and real-posting
  trial, see below). `7ea2e30` brought the redesign, with **migration 0001 applied on prod** (applications:
  `status`, `deadline`, `status_note`). It adds the 2026-11-21 redesign phases below. Checked on prod with the
  demo account: status filter/pill, status form, re-analyse, preview, quick-add, PDF `?education=first`, link
  intake from Vercel (and 169.254.169.254 refused), poster read by Gemini, no overflow at 375px, no errors.
  Before that, `ec2315d` (2026-11-14) brought the UI polish,
  the Google-user password fix (`1c4c75b`), resume import (`69f45c1`) and guard round 2 (`45fe46d`, `ec2315d`).
  The résumé v3 and vector033.github.io quote the round-2 numbers (164/172 blind held-out, 25/25 loose prompt).
  Checked on prod: landing, /login, demo login and PDF export (200, `application/pdf`); no console errors; no
  horizontal scroll at 375px.
- **Google sign-in** is on in prod (`GOOGLE_AUTH_ENABLED=true` on Vercel). **Not yet confirmed:** that a real
  Google login and "Connect Google" complete; the user tests that.
- **Local:** Docker Desktop, local Supabase and the dev server are **stopped**.
  - Start with: `docker desktop start`, then in `FactFit/`
    `npx supabase start -x studio,storage-api,realtime,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta`,
    then preview `factfit-dev` (port 3000). `factfit-google` is the same server with `GOOGLE_AUTH_ENABLED=true`
    (both in `Desktop\.claude\launch.json`; run only one at a time).
  - Node is at `C:\Program Files\nodejs` (add it to PATH in Bash).
  - Stop when done: `npx supabase stop`, then `docker desktop stop`.

## Recent history (oldest first)

| Commit | What |
|---|---|
| 711f956 … 59385de | Gemini-led redesign: hero GPU shader, proof demo, pipeline and ATS diagrams, textures, design guide sections |
| 481b499 | Landing claims replaced with measured eval numbers (bug-checked) |
| bdb5e20 | UI polish against the guide (below) and demo verdicts tied to the real guard |
| 79a26f0 | README screenshots refreshed |
| 3254a6b | Usage screenshots (guard sandbox, pipeline), settings shots, handoff |
| 1c4c75b | Password status for Google users; landing trims (ATS figure, steps pill); design guide trimmed |
| 69f45c1 | Import facts from a .docx/.pdf resume with a review screen |
| cce93f8 … ec2315d | Guard rounds 1–2 (derived %, acronyms, units, counted-noun warning) + blind holdout2/holdout3 |

### What the 2026-11-13 polish changed

- **Honest demo:** every sentence that shows the guard working lives in `src/lib/demo-drafts.ts`. The landing demo
  (`proof-demo.tsx`), the pipeline (`verification-pipeline.tsx`) and the /login panel compute their verdicts with
  `checkBullet`; `demo-drafts.test.ts` pins them. Add new demo sentences there, never as hand-written labels.
- **Motion:** nothing loops forever. Scan sweep plays once, pipe flow 3 times, the score pulse twice.
  `src/components/in-view.tsx` adds scroll entrances (fade up, ring draw, bars grow) **without ever hiding content**:
  it only marks blocks that start below the fold, so no-JS, reduced motion and already-visible blocks stay still.
  Hero shader pauses off-screen and under reduced motion (verified in Playwright).
- **Removed slop:** uppercase eyebrows, fake system codes (`SYS.01`, `ERR_01`, `GUARD: PASS`), filler badges,
  stacked hero grids/auras, nested cards in the steps, unmeasured claims ("100% Readable", citations in the PDF).
- **Accessibility:** 44px touch targets on phones (CSS rule in `globals.css` for `.btn`, `.input`, `summary` …),
  the comparison table stacks on mobile, all text ≥ 4.5:1 (measured), focus ring on every tab stop.
- **Design guide:** every example now follows the honesty rules (no "0% hallucination", "AST", "100% verified",
  invented competitor stats).

## Map of the code

- **Design tokens** `src/app/globals.css`: `.btn-primary`, `.btn`, `.card`, `.eyebrow` (sentence case now),
  `.paper-texture`, `.fluted-glass`, `.hero-band`; motion keyframes and the reduced-motion block at the end.
  Emerald means only "traceable / verified" and focus.
- **Landing** `src/app/page.tsx` with `proof-demo.tsx`, `steps.tsx`, `verification-pipeline.tsx`,
  `benchmark-metrics.tsx`, `ats-anatomy.tsx`, `hero-shader.tsx`, `in-view.tsx`.
  Numbers shown come from `eval/README.md`: change both together.
- **App shell** `src/app/app/layout.tsx` + `nav.tsx`. Bullet toolbar in `bullet-studio.tsx` sticks at `md:top-16`.
- **Login** `src/app/login/*`; Google button only when `GOOGLE_AUTH_ENABLED=true` (`src/lib/site.ts`);
  OAuth return `src/app/auth/callback/route.ts` (uses `safeNext`).
- **Settings** `src/app/app/settings/`: Account, `security/`, `data/`; actions in `actions.ts`; UI pieces `ui.tsx`,
  `forms.tsx`. The demo account's settings are locked.
- **Account data** `src/lib/account.ts`; `listSessions()` reads `auth.sessions` with raw SQL and falls back to null.
- **LLM** `src/lib/llm/provider.ts`: Gemini, or `LLM_PROVIDER=freellmapi` (local only).
- **Resume import** (Fact bank page, `src/app/app/facts/import-resume.tsx`): `importResumeAction` reads the upload in
  memory (`src/lib/import/extract.ts`: magic-byte check, 2 MB cap, `fflate` for .docx with a zip-bomb cap, `unpdf`
  for PDF, max 10 pages), then `parseResume` (Gemini, counted against the daily AI limit) or the rule-based
  `parseResumeRuleBased` (`src/lib/core/resume.ts`) when there is no key, the limit is used up or the model fails.
  `finishDraft` drops tech and months the file never names and flags numbers it does not contain. Nothing is saved
  until the review screen calls `saveImportAction`, which reuses the manual-form zod schemas. Off for the demo
  account. Gemini rejects nested `maxItems` in a response schema (400), so the resume schema has no `.max()`.
  Server action body limit is raised to 3 MB in `next.config.ts`. Importing the same file twice makes duplicates.

## Screenshots

`scripts/screenshots.mjs` exports `shoot(page, base, dir)`: landing, guard sandbox, pipeline, landing mobile, login,
fact bank, application (+ mobile) and bullet studio, all with reduced motion so frames are still.
Run it with the Playwright install in `Desktop\HarnKan\node_modules` (load it with `createRequire`), against the local
dev server with the demo account seeded. Headless Chrome needs `--use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader` for the hero shader to draw.
The two settings shots are not in the script: sign up a throwaway local account (random credentials), capture
`/app/settings` and `/app/settings/security` with `factfit-google` running, then delete the user with the local
Supabase admin API (`npx supabase status -o env` gives the service key).

## 2026-11-21 redesign (from the user's local `UX_AUDIT_AND_REDESIGN_PLAN.md`, never committed: it has their email)

| Commit | What |
|---|---|
| 0548655 | Phase 1: sticky toolbar fix (z-15, `isolate`, 95% glass), `formatRange` single month + year-only, date presets + Ongoing (`facts/date-fields.tsx`), header first with PDF-unsafe character warning + "Remove them", Edit/Close, no model name, PDF filename <= 60 |
| 943cf97 | Phase 2: import reads the header (`finishProfile` keeps only text in the file) and degree GPAX/coursework; stack line to every fact; `normalizeTag`; duplicate entries start unticked; tech chips (`facts/tech-chips.tsx`); Matching v2 `backs()` in `match.ts` only |
| 6bf3872 | Phase 3: job intake from a link (`lib/import/job-source.ts`, SSRF-guarded at socket lookup and per redirect), a poster/screenshot (Gemini `inlineData`), or text; career-track pills |
| 647919f | Phase 4: re-analyse (keeps old analysis on AI failure), quick-add fact from missing skills, PDF preview + Education first, GitHub repo import (`lib/import/github.ts`) |
| 7ea2e30 | Status tracker + migration 0001 |
| 523fa9f | Real-resume trial: duplicate import check by name/kind (`sameEntry` in `core/types.ts`), outcome-only facts join the fact before, `applyTrack` in `jd.ts` (other tracks' areas become preferred in code), all-caps headline title-cased, `normalizeTag` drops brackets and inner versions |
| f3c5998 | "Sem 1/2026" reads as the year 2026, not January |
| eb99489 | Real-posting trial: PDF preview renders on open (showed stale bullets after Save), "any one of" options stay one requirement ("Java / C# / Python"), matching-only umbrella terms (Next.js->React, TypeScript->JavaScript, FastAPI->REST, PostgreSQL->RDBMS, Firestore/Redis->NoSQL), language requirements need a language fact, link intake fills role/company from the page title |

Trial notes (owner's own account, 2026-11-21): applications for Gosoft, Agoda co-op and summer
(Greenhouse links read fine), P&G (Workday needs scripts, so text was pasted) and KPMG. Re-analyse takes ~40 s
on Gemini Flash-Lite and the button shows no pending state yet. Known guard limit: a draft can invent a cause
("reached 90-100% mutation score by building JWT auth") because the guard checks numbers and tools only.

Rules kept: the guard, `mentions()` and the eval are unchanged (eval numbers identical after every phase).
Matching v2 lives in `match.ts` only because `mentions()` also feeds the eval's extraction recall.
Manually typed tags are never rewritten (they are guard evidence); tags are cleaned only on import and in the PDF.

## Left to do (pick with the user)

1. **Job discovery was skipped on purpose.** Adzuna needs the user to register for keys and its docs do not
   confirm Thailand; PingKhana's feed is Thai education news (its "รับสมัครงาน" posts are mostly teaching and
   government jobs), with no tech-internship sources. "Paste a link" covers company career pages.
   Optional: add `GITHUB_TOKEN` (read-only) on Vercel; without it GitHub allows 60 repo imports an hour per IP.
2. **Guard, round 3 (optional).** Branch `guard-false-blocks`: derived percentages (direction-aware), acronyms from
   initials, counted-noun warning. Blind `holdout3`: 164 / 172 blocked, 24 / 30 honest accepted (`eval/README.md`,
   2026-11-14 round 2). Left: same-number meaning swaps (warning only), coincidental initials ("OEE" from "operator
   error events"), percentages from non-adjacent numbers ("41 of them", "of the 120"), one-word acronyms (PV from
   "photovoltaic"). Any change needs a new blind `holdout4`; tune on `eval/cases` only (`npm run eval -- -t "eval set"`).
3. Google sign-in works on prod (the user signed in with it on 2026-11-14, and the prod role can read
   `auth.sessions`, since the device check passes). Still untested: "Connect Google" from an email account.
4. Turn on **Secure password change** in the Supabase dashboard (Authentication → Providers → Email). Without it,
   anyone holding a session token can change the password through the Supabase API directly, skipping the
   app's current-password check. It is project-wide (HarnKan and SlipJot share the project), so the user decides.
5. Add FactFit to the résumé and the portfolio "Other projects" section, with real eval numbers only.

## Gotchas

- The Write tool stores `\u00A0` as a real no-break character, and long `python - <<'EOF'` heredocs break in Bash.
  Write edit scripts to the scratchpad and run the file; check `\uXXXX` escapes after writing.
- Playwright: leaving a page with unsaved bullets fires a `beforeunload` dialog; add `page.on('dialog', d => d.accept())`.
  A headed Playwright window may fail to launch from this agent; use headless with the swiftshader flags above.
- Hydration warnings about `caret-color` come from Playwright screenshots, not from the app.
- `client_secret_FactFit.json` was moved to `C:\Users\User\Documents\secrets\` on 2026-11-14. Keep secrets out of the project.
- A Google user who sets a password gets no `email` identity, so `getAccount()` also asks `auth.users` whether a
  password is stored (`passwordSet` in `src/lib/account.ts`). Supabase never unlinks a user's last identity.
- Supabase prod is shared with HarnKan and SlipJot. Never change its Site URL. App data lives in schema `factfit`.
- Prod migrations: `DATABASE_URL=<MIGRATE_DATABASE_URL from .env.vercel-production> npm run db:migrate` (the
  env var wins over `.env.local`). Migrate first, then deploy code that reads the new columns.
- `vercel deploy` uploads the whole folder: move `UX_AUDIT_AND_REDESIGN_PLAN.md` (untracked, has the user's
  email) out of the folder while deploying, or add it to `.vercelignore`.
- Local e2e tests that sign up throwaway accounts hit the app's 5 sign-ups/IP/hour limit; clear
  `factfit.rate_limits` in the local DB only. Next's route announcer also has `role="alert"` (empty).
