# FactFit handoff (session 2026-11-07 → 2026-11-09)

Read this first, then `CLAUDE.md` (status line + rules) and `README.md`. Answer the user in **Thai**.

## How to work in the new session

- **Token budget:** turn on `caveman` (short replies) and `ponytail` (smallest complete change) at the start.
  If a skill isn't listed, skip it. Keep chat short; put detail in files.
- **Design skills:** run `ls ~/.claude/skills`, then use the design skills that fit the task. Includes the elaya
  ai-design-skills set and the other design skills installed on 2026-11-09. Ones used or useful here:
  `no-ai-design-slop` / `audit-ai-design-slop` (before), `better-interface` (after; it routes to `better-accessibility`,
  `better-layout`, `better-writing`, `better-typography`, `better-colors`, `better-ui`), `break-ui` (worst-case data),
  `animate` (motion), `form-design`, `landing-page-design`, `tastemaker`.
  To save tokens, run a heavy review skill in a subagent and take back only the ranked findings.
- **Rules (from CLAUDE.md):** ask before every push or deploy. Never invent resume or portfolio facts.
  Deploy with `npx vercel@latest deploy --prod --yes`.

## Where things stand

- **Live:** https://factfit-five.vercel.app. Repo github.com/Vector033/FactFit (private). `main` = `5c1fce3`, pushed and deployed.
- **Google sign-in is live.** The user made OAuth client "FactFit" in Google Cloud project `vector033-projects`.
  - Shared Supabase project `ddyjypurrrzasbtfwncs` has the Google provider on, manual linking on, and redirect URL
    `https://factfit-five.vercel.app/**`.
  - Vercel prod has `GOOGLE_AUTH_ENABLED=true`.
  - The button reaches Google correctly. **Not yet confirmed:** that a real Google login completes; the user was going to test it.
- **Local:** Docker Desktop, local Supabase and the dev server are **stopped**.
  - Start with: `docker desktop start`, then
    `npx supabase start -x studio,storage-api,realtime,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta`
    in `FactFit/`, then preview `factfit-dev` (port 3000).
  - Node is at `C:\Program Files\nodejs` (add it to PATH in Bash).

## What this session did (commits, oldest first)

| Commit | What |
|---|---|
| 04ff24f | Added `CLAUDE_DESIGN_GUIDE.md` (user's design notes) |
| 709738a | First UI pass: guard demo on the landing page, score ring, confirm before deletes, undo for removed bullets, mobile fixes, README screenshots |
| e641448 | FreeLLMAPI as a 2nd LLM provider + `--prompt loose` stress eval (numbers below) |
| 103d22d | Slate + Inter redesign after brandlize-template.webflow.io; Settings tabs; Google sign-in; password show/hide |
| 4799246 | Ignore `client_secret*.json` in `.gitignore` and `.vercelignore` |
| 5c1fce3 | Sidebar replaced by a centred top bar (user asked: three items didn't need a column) |

### Map of the new code

- **Design tokens** in `src/app/globals.css`.
  - Classes: `.btn-primary` (slate-800), `.btn`, `.btn-light`, `.icon-tile` (sky), `.hero-band` (slate-700 + grid).
  - Emerald means only "traceable / verified" and focus.
  - Reveal and score-ring animations respect reduced motion.
- **Landing page** `src/app/page.tsx`.
  - Its demo is `src/components/proof-demo.tsx`: the real guard on a fictional fact.
  - The eval numbers it shows come from `eval/README.md`. Change both together.
- **App shell** `src/app/app/layout.tsx` + `nav.tsx` (top bar).
  - The bullet toolbar in `bullet-studio.tsx` sticks at `md:top-16`.
- **Login** `src/app/login/*`.
  - Google button appears only when `GOOGLE_AUTH_ENABLED=true` (`src/lib/site.ts`).
  - OAuth return route: `src/app/auth/callback/route.ts`, which uses `safeNext`.
- **Settings** `src/app/app/settings/`: `page.tsx` = Account, `security/`, `data/`.
  - `actions.ts`: password change re-checks the current password with a throwaway client; also sign out others,
    revoke a session, link/unlink Google.
  - UI pieces: `ui.tsx` (Section/Row), `forms.tsx`.
- **Account data** `src/lib/account.ts`.
  - `getAccount()` reads Supabase user + identities.
  - `listSessions()` reads `auth.sessions` with raw SQL (`sql` from `src/db`). If the DB role can't read it, it returns null and the page falls back.
- **Pure helpers** `src/lib/auth-utils.ts` (`safeNext`, `describeAgent`) and `src/lib/password.ts`, tested in `auth-utils.test.ts`.
- **Supabase client** `src/lib/supabase/server.ts` forwards the browser's user-agent and IP, so the device list shows "Chrome on Windows", not "node".
- **Demo account** (shared, fictional): settings are locked and its device list is hidden.
- **LLM** `src/lib/llm/provider.ts`: `OpenAICompatibleProvider`, selected with `LLM_PROVIDER=freellmapi` + `FREELLMAPI_KEY`. Local only, never on Vercel.
- **Screenshots:** `scripts/screenshots.mjs`, output in `docs/screenshots/`.

### Eval results added (details in eval/README.md)

- Typhoon 2.5 with the "make it impressive" (`loose`) prompt invented 26 claims. The guard blocked all 26.
  It also blocked 10 honest paraphrases: derived %, "0.91" → "91%", abbreviations like VMs/SSR, inferred terms.
- Flash-Lite with the loose prompt: 2 invented claims, both blocked.
- gpt-oss / Qwen: no numbers, they hit free-tier rate limits.

## Left to do (pick with the user)

1. **Import resume (.docx/.pdf).** Extract facts, the user reviews and edits them. Still missing from the MVP.
2. **Guard false blocks.** Accept derived percentages and an abbreviation list. Tune on the 30 tuning cases only; never on holdout.
3. Confirm a real Google login and "Connect Google" on prod (the user tests it).
4. Confirm the prod DB role can read and delete `auth.sessions`. The prod check was blocked by the permission
   classifier, so ask the user to run it or allow it. Until then the device list may be hidden on prod.
5. Add FactFit to the résumé and the portfolio "Other projects" section, with real eval numbers only.

## Gotchas

- Bash breaks on long `python - <<'EOF'` heredocs that contain backticks. Write the script to the scratchpad and run the file.
- Playwright: leaving a page with unsaved bullets fires a `beforeunload` dialog. Add `page.on('dialog', d => d.accept())`.
- Hydration warnings about `caret-color` come from Playwright screenshots, not from the app.
- `client_secret_FactFit.json` sits in the FactFit folder. It is ignored by git and Vercel; tell the user to move it out.
- Supabase prod is shared with HarnKan and SlipJot. Never change its Site URL. App data lives in schema `factfit`.
- The user wants Docker stopped when not in use. Stop it at the end: `npx supabase stop` then `docker desktop stop`.
