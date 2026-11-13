# FactFit design guide

The rules for any UI change in FactFit. The longer study notes this grew from (reference sites, video summaries,
prompt recipes) are in git history: `git show 3254a6b:CLAUDE_DESIGN_GUIDE.md`.

## 1. Honesty (wins over everything below)

- Every number on the site comes from `eval/README.md`. Change both together.
- Do not ship "0% hallucination", "100% verified/accurate", "mathematical" guarantees or legal claims such as
  "PDPA compliant".
- The guard is regex plus a tech vocabulary (`src/lib/core/guard.ts`), not an "AST". The 40 eval cases are fictional.
- No invented stats about other products, testimonials, user counts or logos.
- Demo sentences that show the guard working live in `src/lib/demo-drafts.ts`. Their verdicts are computed by
  `checkBullet` and pinned by `demo-drafts.test.ts`; never hand-write a verdict label.

## 2. Tokens

Defined in `src/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#f8fafc` (slate-50) | page background (about 60% of the surface) |
| `--ink` | `#1e293b` (slate-800) | text; slate-900 for headings |
| `--hairline` | `#e2e8f0` (slate-200) | borders and dividers |
| `--accent` | `#047857` (emerald-700) | only "traceable / verified" states and the focus ring |
| `--danger` | `#b91c1c` (red-700) | only guard rejections |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | every transition and entrance |

Components: `.btn-primary`, `.btn`, `.btn-ghost`, `.btn-danger`, `.input`, `.label`, `.card`, `.eyebrow`
(sentence case), `.paper-texture`, `.fluted-glass`, `.hero-band`. Type is Inter; Geist Mono only for fact IDs,
file names and code.

## 3. Anti-slop rules

1. No filler badges ("AI-Powered", "Smart Match"). Keep only status badges with a real state: Traceable, Blocked,
   Missing.
2. Drop labels the layout already says. No uppercase tracked eyebrows over every heading.
3. No random italics; use weight and size for emphasis.
4. Mono only for IDs, file names and code. No fake system codes (`SYS.01`, `ERR_01`).
5. Bind colours, radii and fonts to the tokens; no stray hex values in classes.
6. Show the actual product: the real guard on a fictional fact, not abstract shapes.
7. The fabrication guard is the main feature; give it the most space.
8. Group with spacing before borders. No card inside a card inside a card.
9. Specific headlines ("Tailor your resume to each job without inventing a single fact"), not generic AI copy.
10. One primary CTA per view: high contrast, `press` compression on tap.
11. Emerald is about 10% of the surface and only means verified, active or primary.
12. Icons from `src/components/icons.tsx` only, one stroke width.
13. No decorative blobs, squiggles or floating shapes.
14. Nested radius: inner = outer − padding (`rounded-lg` + `p-1` gives buttons `rounded`).
15. Text contrast at least 4.5:1 (3:1 for large text). No slate-300 text on white.
16. `text-wrap: balance` on headings (`.display-heading`); avoid one-word last lines.
17. Align icons optically, not by bounding box.
18. `tabular-nums` on scores, counts, dates and metrics.
19. Every async action has a loading state (skeleton or shimmer) and a result message.
20. Animate state changes and feedback only (draw, pulse, shake), never for decoration.

## 4. Motion

- Nothing loops forever. The scan sweep plays once, the pipe flow three times, the score pulse twice.
- Scroll entrances use `src/components/in-view.tsx`. It never hides content: no-JS, reduced motion and blocks already
  on screen stay as rendered.
- `prefers-reduced-motion: reduce` gives the static final state everywhere (see the block at the end of
  `globals.css`).
- Transitions 150–550 ms with `--ease-out`; press feedback `scale(0.98)`.

## 5. Surfaces and backgrounds

- **Hero (`/`) and `/login` only:** the GPU shader (`hero-shader.tsx`), the square-dot grid, the dark `.hero-band`.
  The shader stops under reduced motion and off-screen, and caps its drawn pixels (`maxPixelCount`).
- **Workspace (`/app/**`):** calm `--canvas`, `.card` surfaces, `.paper-texture` on resume-like sheets, the
  `.fluted-glass` top bar. No shaders or grids behind tables and forms.
- A texture behind text needs a scrim so the text still meets contrast.

## 6. Layout and accessibility

- 8-point spacing: 16px inside a group, at least 32px between groups, 64–96px between landing sections.
- Reading width 50–75 characters (`.body-prose`). Headings line-height 1.1, body 1.6.
- Touch targets at least 44×44px on phones (the rule near the end of `globals.css` covers `.btn`, `.input`, `summary`).
- Visible keyboard focus everywhere (one `:focus-visible` outline in `globals.css`).
- Never rely on colour alone: red and green states always carry an icon and words.
- Check 375px and 1280px: no horizontal scroll; tables stack on phones.

## 7. Before you finish a UI change

Run `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` and `npx next build`. Check the changed pages at 375px and
1280px, with reduced motion on and off, and with the keyboard.
