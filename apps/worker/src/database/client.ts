import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { WorkerContext } from "../types";
import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

export const getDb = (context: WorkerContext): Database | undefined =>
  context.env.DB === undefined ? undefined : drizzle(context.env.DB as never, { schema });
