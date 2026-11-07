import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

// Fixed-window rate limiting backed by Postgres, so the count holds across every
// serverless instance. Keys are HMAC-hashed: the table never stores an IP or an email.

export type Limit = {
  /** Bucket name, e.g. "signin-ip". */
  name: string;
  max: number;
  windowSec: number;
};

const DAY = 86_400;

export const LIMITS = {
  signinIp: { name: "signin-ip", max: 30, windowSec: 600 },
  signinEmail: { name: "signin-email", max: 8, windowSec: 600 },
  signupIp: { name: "signup-ip", max: 5, windowSec: 3600 },
  demoIp: { name: "demo-ip", max: 30, windowSec: 3600 },
  /** Gemini calls (job analysis or drafting) per signed-in user per day. */
  llmUserDay: { name: "llm-user-d", max: Number(process.env.LLM_DAILY_LIMIT ?? 15), windowSec: DAY },
  /** All visitors of the shared demo account together. */
  llmDemoDay: { name: "llm-demo-d", max: Number(process.env.LLM_DEMO_DAILY_LIMIT ?? 40), windowSec: DAY },
  demoResetIp: { name: "demo-reset-ip", max: 10, windowSec: 3600 },
} satisfies Record<string, Limit>;

function secret() {
  return process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SECRET_KEY || "dev-only-rate-limit-secret";
}

function hashKey(name: string, subject: string) {
  return `${name}:${createHmac("sha256", secret()).update(subject.toLowerCase()).digest("base64url").slice(0, 32)}`;
}

/** Client IP as Vercel reports it, or "unknown". */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export class RateLimitError extends Error {
  constructor(readonly retryAfterSec: number) {
    super("rate limited");
  }
}

/**
 * Counts one hit against `limit` for `subject` and returns whether it is still
 * allowed. One atomic upsert per call; old windows are swept now and then.
 */
export async function hit(limit: Limit, subject: string): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const windowMs = limit.windowSec * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const key = hashKey(limit.name, subject);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(now - 2 * DAY * 1000))).catch(() => {});
  }
  const retryAfterSec = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
  return { ok: row.count <= limit.max, retryAfterSec };
}

/** Throws RateLimitError when any of the limits is exhausted. */
export async function enforce(...checks: (readonly [Limit, string])[]) {
  for (const [limit, subject] of checks) {
    const r = await hit(limit, subject);
    if (!r.ok) throw new RateLimitError(r.retryAfterSec);
  }
}

export function retryText(sec: number) {
  return sec >= 3600 ? `${Math.ceil(sec / 3600)} h` : `${Math.max(1, Math.ceil(sec / 60))} min`;
}
