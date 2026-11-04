# FactFit eval

40 fictional job-posting + fact-bank cases, hand-labelled, used to measure the fabrication guard, skill extraction
and the live drafting pipeline. No real person's data is used.

| Set | Cases | Role families | Used for |
|---|---|---|---|
| `cases/a-web.json` | 10 | frontend, full-stack, mobile | tuning + CI |
| `cases/b-backend.json` | 10 | backend, data, DevOps, ML, LLM apps | tuning + CI |
| `cases/c-other.json` | 10 | QA, game dev, IT support, embedded, security, BA, tech writing, UX, TA, Thai co-op | tuning + CI |
| `holdout/holdout.json` | 10 | Rails, .NET, Android, data science, SRE, Salesforce, hardware test, e-commerce ops, Rust, design | reported only |

Each case has a posting, labelled required/preferred skills, the skills the candidate lacks (bait), a fact bank,
2–3 **faithful** bullets a careful human would write, and 2–4 hand-written **fabrications** of five kinds:
`number` (invented or inflated metric), `unit` (same digits, different unit or meaning), `tech` (a tool the facts
never mention), `multiplier` ("doubled", "10x"), and `citation` (a real claim pinned to the wrong fact).
`metrics.ts` also generates fabrications from every faithful bullet (changed number, added percentage, added
missing tool, added "doubling", wrong citation), so the guard is not only tested on mistakes someone hand-picked.

The held-out set was written by a separate author **after** the guard was tuned, without access to the guard's code
or the tuning cases, and the guard was not changed after seeing its score.

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

## Run it

```bash
npm run eval                      # offline: guard + rule extractor, tuning and held-out sets (also runs in npm test / CI)
npm run eval:live                 # live: Gemini analysis + drafting on the tuning set; writes eval/results/*.json
npm run eval:live -- --limit 5    # a quick sample
npx tsx eval/validate.ts eval/cases/*.json eval/holdout/*.json
```
