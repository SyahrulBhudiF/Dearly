import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  strict: true,
  verbose: true,
});
