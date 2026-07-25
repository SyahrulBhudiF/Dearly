import type { WorkerEnv } from "../../alchemy.run";
import { Config, ConfigProvider, Context, Layer, Option } from "effect";

const stringEnv = (env: WorkerEnv): Record<string, string> =>
  Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );

export interface AppConfig {
  readonly appEnv: string;
  readonly timeZone: string;
  readonly access: Option.Option<{ readonly aud: string; readonly teamDomain: string }>;
  readonly devOwnerId: Option.Option<string>;
}

const appConfig = Config.all({
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

export class ConfigService extends Context.Service<ConfigService, AppConfig>()("ConfigService") {}

export const ConfigLive = (env: WorkerEnv) =>
  Layer.effect(ConfigService, appConfig.parse(ConfigProvider.fromEnv({ env: stringEnv(env) })));
