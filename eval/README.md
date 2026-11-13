# FactFit eval

60 fictional job-posting + fact-bank cases, hand-labelled, used to measure the fabrication guard, skill extraction
and the live drafting pipeline. No real person's data is used.

| Set | Cases | Role families | Used for |
|---|---|---|---|
| `cases/a-web.json` | 10 | frontend, full-stack, mobile | tuning + CI |
| `cases/b-backend.json` | 10 | backend, data, DevOps, ML, LLM apps | tuning + CI |
| `cases/c-other.json` | 10 | QA, game dev, IT support, embedded, security, BA, tech writing, UX, TA, Thai co-op | tuning + CI |
| `holdout/holdout.json` | 10 | Rails, .NET, Android, data science, SRE, Salesforce, hardware test, e-commerce ops, Rust, design | reported only (2026-11-04; no longer blind) |
| `holdout2/holdout2.json` | 10 | network, product analytics, GIS, bioinformatics, Kotlin, DBA, MLOps, robotics, credit risk, digital marketing | reported only (2026-11-14 round 1; seen since) |
| `holdout3/holdout3.json` | 10 | SAP, healthcare informatics, PLC, accessibility, supply chain, manufacturing vision, solar, localization, smart contracts, game QA | reported only (2026-11-14 round 2) |

Each case has a posting, labelled required/preferred skills, the skills the candidate lacks (bait), a fact bank,
2–3 **faithful** bullets a careful human would write, and 2–4 hand-written **fabrications** of five kinds:
`number` (invented or inflated metric), `unit` (same digits, different unit or meaning), `tech` (a tool the facts
never mention), `multiplier` ("doubled", "10x"), and `citation` (a real claim pinned to the wrong fact).
`metrics.ts` also generates fabrications from every faithful bullet (changed number, added percentage, added
missing tool, added "doubling", wrong citation), so the guard is not only tested on mistakes someone hand-picked.

Each held-out set was written by a separate author **after** the guard was tuned, without access to the guard's code
or the tuning cases, and the guard was not changed after seeing its score. Once a held-out score has been reported,
that set is no longer blind; the next guard change gets a new one.

## Results (2026-11-14, round 2): direction-aware percentages, acronyms from initials, `holdout3`

### What changed in the guard

- **Direction.** A before/after pair A → B backs only the change relative to A, plus the ratio: $5,200 → $3,100
  backs a 40% cut, never 60% (the share that remains). "X of Y" and "X/Y" back only X / Y.
- **Acronyms from initials.** An all-caps token the list does not know passes when consecutive words of the cited
  fact spell its initials: PITR ← "point-in-time recovery", VLANs ← "virtual LANs", GA4 ← "Google Analytics 4".
  Small words may be skipped (PD ← "probability of default"). Listed abbreviations still need their own expansion,
  and tool names in the vocabulary (AWS, GCP) are judged by the vocabulary, never by initials. British and American
  spellings compare equal ("optimisation").
- **Units.** mm, cm, km, kg and pps, and a pair may repeat a unit phrase ("1,200 packets per second to 300
  packets per second").
- **Each use is checked.** A number used twice is checked in each context, so an honest "30% of sign-ups" no
  longer lets a later "cutting costs by 30%" through.

Tuned on the 30 tuning cases and their saved live drafts only. `holdout2` was already seen, so it is reported
below as a re-run, not a blind score. The guard was frozen at commit `45fe46d`, then `holdout3` was written by a
fresh author under the same rules as `holdout2` and scored once.

### Fabrication guard (offline, deterministic)

| | Tuning (30) | `holdout3` (10, blind) | `holdout2` (10, re-run, seen) | `holdout` (10, re-run, seen) |
|---|---|---|---|---|
| Fabrications blocked | **547 / 547** | **164 / 172 (95.3%)** | 174 / 184 (94.6%) | 178 / 186 (95.7%) |
| Faithful bullets accepted | 90 / 90 | **24 / 30 (80.0%)** | 29 / 30 | 30 / 30 |
| Counted-noun warnings on accepted faithful bullets | 0 / 90 | 1 / 24 | 0 / 29 | 1 / 30 |

`holdout3` by kind: number 71/71 · multiplier 34/34 · citation 35/35 · tech 21/22 · unit 3/10. Its 10 role
families are new (SAP consultant, healthcare informatics, PLC automation, accessibility, supply-chain planning,
manufacturing vision, solar monitoring, localization, smart contracts, game QA), and it includes 24 faithful derived
values in five forms, 24 spelled-out acronyms, 10 wrong derived percentages and 7 acronyms the facts never spell out.

**What `holdout3` let through (8 of 172):**

- 7 counted-noun swaps with the same number ("8,400 vendor master records" for material records, "1,320 duplicate lab
  orders", "14 classes" for a class of 14, "1,450 student accounts" for test transactions …). The warning flagged 2.
  Same-number meaning swaps remain the main limit.
- **"Tracked OEE …"**: the author planted this coincidence. The cited fact logs "operator error events", whose
  initials spell OEE, but OEE (overall equipment effectiveness) is something else. The initials rule cannot tell
  them apart. This is a new kind of miss that round 1 would have blocked.

All 10 wrong derived percentages were blocked, including the 4 that report the share that remains instead of the cut.

**Honest bullets it blocked (6 of 30):**

- 4 percentages whose numbers are in the fact but not as one adjacent pair: "138 issues, 41 of them blockers" (30%),
  "96 of the 120 tickets" (80%; "of the" is not a pair joiner), "13 of the 16 clients" (81%), "386 bugs; 312 were
  fixed" (81%).
- "27 of 312 string inverters (9%)": the arithmetic is backed, but a percentage inside brackets has no nearby words
  to tie it to the fact.
- 2 acronyms of a single compound word: OPD ← "outpatient department", PV ← "photovoltaic".

**`holdout2` re-run (seen, not blind):** faithful accepted rose from 16 / 30 to 29 / 30; the one left is "…, a 15%
relative gain" (no shared word near the number). Blocked went from 173 to 174 / 184: the "60%" cost bug and the
repeated "30%" are now blocked, but "from 2,100 to 3,400 per week" (fact: per month) now passes. Round 1 had only
blocked it because "SEO" did not match "optimisation"; a period swap ("per month" → "per week") is not checked.

**Old `holdout` re-run:** 178 / 186 blocked (round 1: 177), 30 / 30 accepted.

### Saved live drafts, re-scored (tuning cases)

Typhoon loose 45 → 32 blocked, Typhoon current 9 → 8, Flash-Lite loose 10 → 10. Compared with round 1, one more
draft passes, "Utilized Linux and Git … in OS and networking labs", where the fact says "operating systems". No draft
went from accepted to blocked; the 25 labelled inventions are all still blocked.

## Results (2026-11-14, round 1): derived numbers, abbreviations, counted-noun warning

### What changed in the guard

- **Derived percentages and ratios.** A percent or multiplier passes when one cited fact computes it from a
  before/after or part/whole pair joined by "to", "of" or "/" (410 → 260 KB as "36%" or "37%", "78 of 100" as "78%",
  "0.91" as "91%", 12 min → 40 s as "94%"), within rounding (a percent may round either way; a multiplier must be within
  5%, so "halved" never covers 410 → 260). The words next to the number must share a word with that fact, so the
  right arithmetic about the wrong thing ("cutting costs by 30%" from a hit rate that rose 30%) is still blocked.
- **Abbreviations.** An all-caps token is backed when the facts spell it out (`ABBREVIATIONS` in `vocab.ts`:
  VMs, SSR, SSO, CDN, RPS …), and "Dockerized" counts as Docker.
- **Counted-noun warning.** The same whole number with a different counted noun ("120 bookings" from "120 members")
  gets a soft warning in the bullet studio and the landing sandbox, not a block.

All of this was tuned on the 30 tuning cases and the saved live drafts of those cases only. The guard was then
frozen (commit `9931e73`) and run once on a new held-out set.

### Fabrication guard (offline, deterministic)

| | Tuning set (30) | New held-out set `holdout2` (10) |
|---|---|---|
| Fabrications blocked | **547 / 547** | **173 / 184 (94.0%)** |
| Faithful bullets accepted | 90 / 90 | **16 / 30 (53.3%)** |
| Counted-noun warnings on accepted faithful bullets | 0 / 90 | 0 / 16 |
| By kind | | number 68/70 · multiplier 37/37 · tech 32/33 · citation 34/34 · unit 2/10 |

`holdout2` was written by a separate author (a subagent) who could read only the case schema, the five fabrication
kinds and one tuning case, not the guard, the other cases or this file's results. It covers 10 new role families
(network, product analytics, GIS, bioinformatics, Kotlin backend, DBA, MLOps, robotics, credit risk, digital
marketing) and deliberately includes faithful derived percentages and abbreviations, wrong derived percentages and
counted-noun swaps. It was scored once; the guard was not changed afterwards.

**The new rules did not generalise well to new domains.** 14 of 30 honest bullets were blocked:

- 13 used a domain acronym the facts spell out but the fixed list does not know: VLANs, OSPF, APs, SNMP, GPS, HPC,
  RPO, PITR, EKS, ROS, PD, DPD, GA4/GTM, and SEO, which is in the list, but the fact spells "optimisation".
  A rule that accepts an acronym whose letters are the initials of a phrase in the cited fact ("PITR" from
  "point-in-time recovery") would cover most of these, but needs a fresh blind set to measure.
- 3 derived numbers were blocked (2 of them in bullets above): units the guard does not know ("packets per second",
  "cm") break the before/after pairing, and "…, a 15% relative gain" shares no word with its fact.

The 11 fabrications that got through:

- 8 counted-noun swaps ("160 branch offices" for routers, "340 borrowers" for loans, "600 GB per database"…).
  The warning flagged 2 of them ("14 provinces", "220 stores"). Same-number meaning swaps are still the main limit.
- "cutting monthly inference cost by 60%": $5,200 → $3,100 is a 40% cut, but the part-of-whole ratio
  (3,100 / 5,200 = 60%) is also derived from a "to" pair. This is a bug in the new rule: part-of-whole should come
  only from "of" / "/" pairs.
- "cutting costs by 30%" repeated a 30% the same bullet already used honestly; the guard checks each distinct
  number once.
- "Python and R": a one-letter tool name is not detected (existing gap).

**Old held-out set, re-run (no longer blind):** 177 / 186 blocked (was 180 / 186), 30 / 30 faithful accepted.
The 3 new passes are hand-labelled multiplier fabrications whose arithmetic the facts do support: "nearly doubled"
coverage from 41% to 78% (1.9x), "tripled" board test throughput from 6 to 2 minutes per board, and "2.5x" task
success from 2 of 5 to 5 of 5. The counted-noun warning fired on 1 of its 6 missed unit swaps, and on 1 faithful
bullet ("7 Framer landing pages").

### Saved live drafts, re-scored (tuning cases, 796 drafts)

| Run | Blocked before → after |
|---|---|
| Typhoon 2.5 30B, current prompt | 9 → 8 |
| Typhoon 2.5 30B, loose prompt | 45 → 33 |
| Gemini Flash-Lite, loose prompt | 10 → 10 |

No draft went from accepted to blocked. Each of the 13 Typhoon drafts that now pass was re-read against its cited
facts: all are correct arithmetic or a spelled-out abbreviation ("36% from 410 KB to 260 KB", "3 VMs", "Nuxt SSR",
"Dockerized Python services", "91% accuracy"). One of them, "reduced rebuilds by 80%", was listed as a caught
invention on 2026-11-07, but the fact says rebuilds went from 30 to 6, which is exactly 80%. That label was wrong,
so the loose-prompt count of invented claims is 25, and all 25 are still blocked. Flash-Lite's 5 false blocks were
inferred terms ("iOS" for an App Store release, "WCAG" for a contrast fix) and are unchanged.

The counted-noun warning fired on 5 of the 796 drafts: 2 real meaning swaps ("45 meals" for "45 orders",
"1,000 RPS" for a "1,000-request" load test) and 3 honest rewordings ("85 students" for "85 classmates",
"6 users" for "6 testers", "120 participants" for "120 volunteers").

## Results (2026-11-04)

### Fabrication guard (offline, deterministic)

| | Tuning set (30) | Held-out set (10) |
|---|---|---|
| Fabrications blocked | **547 / 547 (100%)** | **180 / 186 (96.8%)** |
| Faithful bullets accepted | 90 / 90 (100%) | 30 / 30 (100%) |
| Held-out by kind | | number 68/68 · multiplier 37/37 · tech 37/37 · citation 36/36 · **unit 2/8** |

All six held-out misses are meaning swaps that keep the same number and unit: "120 members" written as
"120 bookings", "600 GB in total" as "600 GB per server", "over 2 months" as "a month". The guard checks numbers,
units and names token by token; it does not understand what a number counts. That is the known limit.

Tuning on the first 30 cases fixed three real gaps: unit swaps ("380 MB" → "380 ms", "2 days" → "2 weeks"),
single-word product names outside the vocabulary ("Splunk", "Oracle", "Jupyter-based"), and hyphenated words
("double-charge") being read as multipliers.

### Live pipeline (Gemini Flash-Lite, 30 tuning cases)

| Metric | Value |
|---|---|
| Cases completed | 28 / 30 (1 timeout, 1 free-tier 429 on the fallback model) |
| Drafted bullets | 113 |
| Blocked by the guard | 0 |
| Bait leaks (missing skills or posting-only numbers) before / after guard | 0 / 0 |
| Labelled skills the facts support that appear in an accepted bullet | 83.2% |
| Mean words per bullet | 19.7 (none over 32) |
| Skill extraction recall, required: Gemini / rules | 82.8% / 70.5% |
| Skill extraction recall, all: Gemini / rules | 85.4% / 63.3% |
| Skill extraction precision: Gemini / rules | 81.3% / 94.7% |
| Median time per case (analysis + drafting) | 45 s |

Flash-Lite did not fabricate in this run: the guard blocked nothing, the independent bait check found nothing, and
a manual read of 14 random drafts against their facts found nothing either. Its bullets stay close to the facts
and often append a tool list ("…using Java, Spring Boot, and PostgreSQL") instead of a real XYZ structure, so the
writing is safe but plain. The guard's value is in the offline numbers above: it is what stops a stronger, more
creative model, or a user's own edits, from slipping in a number the facts do not support.

### Drafting prompt v1 → v2 (Gemini Flash-Lite, 30 tuning cases, same rule-based job analysis)

The first live run showed the drafts were safe but plain, so `style.ts` measures XYZ writing without a judge model:
a strong past-tense first verb, the measured result kept when the facts have one, not a word-for-word copy of the
fact, and no trailing tool list ("…using Java, Spring Boot, and PostgreSQL"). Human-written faithful bullets in the
cases score 86.7% on this check.

| | v1 | v2 (current) | Human-written |
|---|---|---|---|
| XYZ-style bullets | 31.6% | **75.0%** | 86.7% |
| Copies the fact sentence | 65.8% | **5.6%** | 4.4% |
| Ends in a tool list | 10.3% | 16.7% | 7.8% |
| Bullets blocked by the guard / bait leaks | 0 / 0 | 0 / 0 | |
| Labelled skills mentioned in some bullet | 83.2% | 72.0% | |
| Cases completed | 30 / 30 | 29 / 30 (free-tier 429) | |

v2 rewrites instead of copying, leads with the outcome ("Cut daily report time from 25 minutes to 3 minutes by
adding a PostgreSQL index…"), keeps team context, gives fictional good/bad examples, and names only the tools the
job asks for. The trade-off is keyword coverage inside bullets: v2 drops filler like "using Git", "HTML" and
"JavaScript", which still appear in the PDF's Skills section. A run that capped tools at two scored 81.1% XYZ but
69.2% coverage, so the current prompt keeps up to three job-relevant tools. One v2 run also showed the guard
blocking a correct bullet that named the experience's own club; names may now come from the bullet's own
experience title and organisation (numbers still only from facts). Each figure is a single run at temperature 0.2,
so differences of a few points are within noise.

### Other models and a fabrication stress test (2026-11-07, rules-based job analysis)

Flash-Lite never fabricated, so the live runs above said nothing about whether the guard catches a real model's
inventions. These runs go through FreeLLMAPI (`--provider freellmapi`), a local router over free model tiers.
`--prompt loose` is not a product prompt: it is what a typical "make my resume impressive, add quantified impact,
use the posting's keywords" request looks like, kept in `eval/prompts.ts` to provoke fabrications.

| Model, prompt | Drafts | Blocked | Bait leaks before / after guard |
|---|---|---|---|
| Typhoon 2.5 30B, current prompt | 90 | 9 (10%) | 0 / 0 |
| Typhoon 2.5 30B, loose prompt | 129 | 45 (35%) | 3 / 0 |
| Gemini Flash-Lite, loose prompt | 133 | 10 (7.5%) | 0 / 0 |

Every blocked bullet was read by hand against the whole fact bank and labelled:

| Blocked bullets | Typhoon, current | Typhoon, loose | Flash-Lite, loose |
|---|---|---|---|
| Invented or inflated claim (number, meaning, year) | 3 | 26 | 2 |
| True elsewhere in the bank, but not in the cited fact | 5 | 9 | 3 |
| Honest paraphrase the guard could not verify (false block) | 1 | 10 | 5 |

- **Caught:** "reduced rebuilds by 80%", "98% resolution rate within SLA", "from 15 s to 2.3 s" (the fact only says
  2.3 s), "97% faster" (12 min → 40 s is 94%), "under 1,000 RPS" from a "1,000-request load test" (caught only because
  "RPS" is a new token). The independent bait check agrees: 3 leaks before the guard, 0 after.
- **Citation errors** are blocked on purpose: a bullet may only use what its cited facts say, even if another fact
  in the bank would back it.
- **False blocks** come from arithmetic and wording the guard does not do: 410 KB → 260 KB written as "36%",
  "0.91" as "91%", "78 of 100" as "78%", "VMs" for "virtual machines", "SSR", "Dockerized", and inferred terms such
  as "iOS" for an App Store release or "WCAG" for a Lighthouse contrast fix. These are the next guard improvement
  (derived percentages, an abbreviation list), to be tuned on the 30 tuning cases only.
- **Not caught by design:** soft overclaims with no number or name, e.g. "enabling operations teams to prioritize
  interventions" or "WCAG AA compliance" from a fact that says contrast checks passed. A spot check of 12 accepted
  Typhoon bullets (current prompt) found 2 of these and no invented numbers.
- gpt-oss-20B and Qwen 3.8 27B were also tried but hit free-tier rate limits after a few cases, so they have no
  numbers here. Single runs at temperature 0.2.

## Run it

```bash
npm run eval                      # offline: guard + rule extractor, tuning and all held-out sets (also runs in npm test / CI)
npm run eval -- -t "eval set"     # tuning set only: use this while changing the guard
npm run eval:live                 # live: Gemini analysis + drafting on the tuning set; writes eval/results/*.json
npm run eval:live -- --limit 5    # a quick sample
npm run eval:live -- --rules-analysis --prompt v1   # compare an older drafting prompt (eval/prompts.ts)
npm run eval:live -- --rules-analysis --prompt loose --provider freellmapi --model typhoon-2.5-30b-a3b-instruct
npx tsx eval/style-report.mts [eval/results/<file>.json]   # XYZ style scores for a saved run
npx tsx eval/validate.ts eval/cases/*.json eval/holdout/*.json eval/holdout2/*.json eval/holdout3/*.json
```
