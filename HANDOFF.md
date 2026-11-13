# FactFit handoff (updated 2026-11-13)

Read this first, then `CLAUDE.md` (status line + rules) and `README.md`. Answer the user in **Thai**; keep code,
commits and UI copy in English.

## How to work in a new session

- **Token budget:** turn on `ponytail` (smallest complete change); `caveman` if the user wants short replies.
  Keep chat short; put detail in files.
- **Design work:** `CLAUDE_DESIGN_GUIDE.md` is the spec. Its honesty rules at the top win over everything else.
  Useful skills: `no-ai-design-slop` / `audit-ai-design-slop`, `better-interface`, `break-ui`, `animate`.
  Run heavy review skills in a subagent and keep only the ranked findings.
- **Rules (from CLAUDE.md):** ask before every push or deploy. Never invent resume or portfolio facts.
  Deploy with `npx vercel@latest deploy --prod --yes`.

## Where things stand

- **Live:** https://factfit-five.vercel.app. Repo github.com/Vector033/FactFit (private).
  `main` is pushed, and the UI polish (`79a26f0`) was deployed to production on 2026-11-13.
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
| (this commit) | Usage screenshots (guard sandbox, pipeline), new settings shots, this handoff |

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

## Screenshots

`scripts/screenshots.mjs` exports `shoot(page, base, dir)`: landing, guard sandbox, pipeline, landing mobile, login,
fact bank, application (+ mobile) and bullet studio, all with reduced motion so frames are still.
Run it with the Playwright install in `Desktop\HarnKan\node_modules` (load it with `createRequire`), against the local
dev server with the demo account seeded. Headless Chrome needs `--use-gl=angle --use-angle=swiftshader
--enable-unsafe-swiftshader` for the hero shader to draw.
The two settings shots are not in the script: sign up a throwaway local account (random credentials), capture
`/app/settings` and `/app/settings/security` with `factfit-google` running, then delete the user with the local
Supabase admin API (`npx supabase status -o env` gives the service key).

## Left to do (pick with the user)

1. **Import resume (.docx/.pdf).** Extract facts; the user reviews and edits them. Still missing from the MVP.
2. **Guard false blocks.** Accept derived percentages and an abbreviation list. Tune on the 30 tuning cases only;
   never on holdout.
3. Confirm a real Google login and "Connect Google" on prod (the user tests it).
4. Confirm the prod DB role can read and delete `auth.sessions` (ask the user to run or allow the check).
5. Add FactFit to the résumé and the portfolio "Other projects" section, with real eval numbers only.

## Gotchas

- The Write tool stores `\u00A0` as a real no-break character, and long `python - <<'EOF'` heredocs break in Bash.
  Write edit scripts to the scratchpad and run the file; check `\uXXXX` escapes after writing.
- Playwright: leaving a page with unsaved bullets fires a `beforeunload` dialog; add `page.on('dialog', d => d.accept())`.
  A headed Playwright window may fail to launch from this agent; use headless with the swiftshader flags above.
- Hydration warnings about `caret-color` come from Playwright screenshots, not from the app.
- `client_secret_FactFit.json` sits in the FactFit folder. It is ignored by git and Vercel; tell the user to move it out.
- Supabase prod is shared with HarnKan and SlipJot. Never change its Site URL. App data lives in schema `factfit`.
