import type { BulletDraft, Fact } from "./types";

/** A fact written as a bullet verbatim. Always passes the guard. */
export function factAsBullet(f: Fact): BulletDraft {
  const did = f.did.trim().replace(/\.$/, "");
  // Lower-case the result's first letter unless it starts a name like "PostgreSQL".
  const result = f.result?.trim().replace(/\.$/, "").replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
  const text = result ? `${did}; ${result}` : did;
  return { experienceId: f.experienceId, text, factIds: [f.id] };
}
