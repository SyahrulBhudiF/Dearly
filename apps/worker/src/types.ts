import type { Option } from "effect";
import type { AppConfig } from "./config";

export interface AssetBinding {
  readonly fetch: (request: Request) => Promise<Response>;
}

export interface D1PreparedStatement {
  readonly bind: (...values: ReadonlyArray<unknown>) => D1PreparedStatement;
  readonly first: <T = unknown>() => Promise<T | null>;
  readonly run?: () => Promise<unknown>;
  readonly all?: <T = unknown>() => Promise<{ readonly results: ReadonlyArray<T> }>;
}

export interface D1Binding {
  readonly prepare: (query: string) => D1PreparedStatement;
}

export interface R2Binding {
  readonly get?: (key: string) => Promise<unknown>;
  readonly put?: (key: string, value: unknown) => Promise<unknown>;
}

export interface DearlyEnv {
  readonly [key: string]: unknown;
  readonly ASSETS?: AssetBinding;
  readonly DB?: D1Binding;
  readonly MEDIA?: R2Binding;
}

export interface WorkerContext {
  readonly config: AppConfig;
  readonly env: DearlyEnv;
  readonly sessionId: Option.Option<string>;
}
