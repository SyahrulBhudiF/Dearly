import type { AppConfig } from "./config";
import type { DearlyEnv } from "./env";

export interface WorkerContext {
  readonly config: AppConfig;
  readonly env: DearlyEnv;
}
