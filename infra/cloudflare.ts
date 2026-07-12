import * as Cloudflare from "alchemy/Cloudflare";

export const Database = Cloudflare.D1.Database("DearlyDB", {
  migrationsDir: "../apps/worker/drizzle",
  migrationsTable: "drizzle_migrations",
});

export const Bucket = Cloudflare.R2.Bucket("DearlyMedia");
