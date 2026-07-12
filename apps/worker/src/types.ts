import type { AppConfig } from "./config";
import type { Option } from "effect";

export interface DearlyEnv {
  readonly [key: string]: unknown;
  readonly ASSETS?: Fetcher;
  readonly DB?: D1Database;
  readonly MEDIA?: R2Bucket;
}

export interface WorkerContext {
  readonly config: AppConfig;
  readonly env: DearlyEnv;
  readonly sessionId: Option.Option<string>;
}
