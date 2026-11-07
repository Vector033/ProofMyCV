import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// Reuse one pool across hot reloads in dev. In production DATABASE_URL is
// Supabase's transaction pooler (:6543): the session pooler allows only 15
// clients for the whole project, which other apps share. Two rules keep
// postgres.js working there: `prepare: false`, and a pool (DB_POOL_MAX) at least
// as large as the most queries the app runs at once, because postgres.js
// pipelines queries onto a busy connection and the transaction pooler hangs on
// pipelined queries. Idle connections are released quickly.
const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    max_lifetime: 60 * 5,
  });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
