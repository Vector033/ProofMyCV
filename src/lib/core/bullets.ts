import type { BulletDraft, Fact } from "./types";

/** A fact written as a bullet verbatim. Always passes the guard. */
export function factAsBullet(f: Fact): BulletDraft {
  const did = f.did.trim().replace(/\.$/, "");
  // Lower-case the result's first letter unless it starts a name like "PostgreSQL".
  const result = f.result?.trim().replace(/\.$/, "").replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
  const text = result ? `${did}; ${result}` : did;
  return { experienceId: f.experienceId, text, factIds: [f.id] };
}

/** Compares two ordered bullet arrays by experience, text, and cited fact IDs. */
export function bulletsEqual(a: BulletDraft[], b: BulletDraft[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.experienceId !== y.experienceId || x.text !== y.text || x.factIds.length !== y.factIds.length) {
      return false;
    }
    for (let j = 0; j < x.factIds.length; j++) {
      if (x.factIds[j] !== y.factIds[j]) return false;
    }
  }
  return true;
}
