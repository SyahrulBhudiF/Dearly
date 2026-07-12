import { Config, ConfigProvider } from "effect";
import type { Config as ConfigDescription } from "effect/Config";
import type { DearlyEnv } from "./env";

const stringEnv = (env: DearlyEnv): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );

export const AppConfig = Config.all({
  appEnv: Config.string("APP_ENV").pipe(Config.withDefault("development")),
  googleClientId: Config.option(Config.string("GOOGLE_CLIENT_ID")),
  googleClientSecret: Config.option(Config.redacted("GOOGLE_CLIENT_SECRET")),
  githubClientId: Config.option(Config.string("GITHUB_CLIENT_ID")),
  githubClientSecret: Config.option(Config.redacted("GITHUB_CLIENT_SECRET")),
  sessionSecret: Config.option(Config.redacted("SESSION_SECRET")),
});

export type AppConfig = typeof AppConfig extends ConfigDescription<infer A> ? A : never;

export const loadConfig = (env: DearlyEnv) =>
  AppConfig.parse(ConfigProvider.fromEnv({ env: stringEnv(env) }));
