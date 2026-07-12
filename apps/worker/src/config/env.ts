import { Config, ConfigProvider } from "effect";
import type { Config as ConfigDescription } from "effect/Config";
import type { DearlyEnv } from "../types";

const stringEnv = (env: DearlyEnv): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );

export const AppConfig = Config.all({
  appEnv: Config.string("APP_ENV").pipe(Config.withDefault("development")),
  timeZone: Config.string("TIME_ZONE").pipe(Config.withDefault("Asia/Jakarta")),
  access: Config.option(
    Config.all({
      aud: Config.string("CF_ACCESS_AUD"),
      teamDomain: Config.string("CF_ACCESS_TEAM_DOMAIN"),
    }),
  ),
  devOwnerId: Config.option(Config.string("DEV_OWNER_ID")),
});

export type AppConfig = typeof AppConfig extends ConfigDescription<infer A> ? A : never;

export const loadConfig = (env: DearlyEnv) =>
  AppConfig.parse(ConfigProvider.fromEnv({ env: stringEnv(env) }));
