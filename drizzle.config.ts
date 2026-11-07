import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["factfit"],
  // Keep the migration log inside our schema too; the hosted project is shared.
  migrations: { schema: "factfit", table: "__drizzle_migrations" },
  dbCredentials: { url: process.env.DATABASE_URL! },
});
