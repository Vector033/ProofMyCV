// Shape of an eval case. Cases live in eval/cases/*.json and describe a
// fictional candidate and a fictional job posting. Never put real people here.

import { z } from "zod";

const id = z.string().regex(/^[a-z0-9-]+$/);

export const evalCaseSchema = z
  .object({
    id,
    /** One line: role family and seniority, for the report. */
    title: z.string().min(3),
    /** The job posting as a candidate would paste it. */
    jd: z.string().min(200),
    /** Hand labels: canonical skill names the posting asks for. */
    expected: z.object({
      required: z.array(z.string()).min(2),
      preferred: z.array(z.string()),
    }),
    /** Skills or claims the posting asks for that the facts do NOT support (bait for fabrication). */
    missing: z.array(z.string()).min(1),
    experiences: z
      .array(
        z.object({
          id,
          kind: z.enum(["job", "project", "education", "activity"]),
          title: z.string(),
          org: z.string(),
          startDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
          endDate: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
        }),
      )
      .min(2),
    facts: z
      .array(
        z.object({
          id,
          experienceId: id,
          did: z.string().min(5),
          result: z.string().nullable(),
          tech: z.array(z.string()),
        }),
      )
      .min(4),
    /** Faithful bullets a careful human would write from the facts. The guard must accept these. */
    gold: z
      .array(z.object({ experienceId: id, factIds: z.array(id).min(1), text: z.string() }))
      .min(2),
    /** Realistic fabrications. The guard must block these. */
    fabricated: z
      .array(
        z.object({
          experienceId: id,
          factIds: z.array(id).min(1),
          text: z.string(),
          kind: z.enum(["number", "unit", "tech", "multiplier", "citation"]),
        }),
      )
      .min(2),
  })
  .superRefine((c, ctx) => {
    const exps = new Set(c.experiences.map((e) => e.id));
    const facts = new Map(c.facts.map((f) => [f.id, f]));
    for (const f of c.facts) {
      if (!exps.has(f.experienceId)) ctx.addIssue({ code: "custom", message: `${c.id}: fact ${f.id} -> unknown experience` });
    }
    for (const b of [...c.gold, ...c.fabricated]) {
      for (const fid of b.factIds) {
        const f = facts.get(fid);
        // A "citation" fabrication may cite a fact from another experience on purpose.
        if (!f) ctx.addIssue({ code: "custom", message: `${c.id}: bullet cites unknown fact ${fid}` });
      }
    }
  });

export type EvalCase = z.infer<typeof evalCaseSchema>;
