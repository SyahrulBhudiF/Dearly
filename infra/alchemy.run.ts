import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import { Bucket, Database } from "./cloudflare";

const APP_ENV = Config.string("APP_ENV").pipe(Config.withDefault("production"));
const GOOGLE_CLIENT_ID = Config.redacted("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Config.redacted("GOOGLE_CLIENT_SECRET");
const GITHUB_CLIENT_ID = Config.redacted("GITHUB_CLIENT_ID");
const GITHUB_CLIENT_SECRET = Config.redacted("GITHUB_CLIENT_SECRET");
const SESSION_SECRET = Config.redacted("SESSION_SECRET");

export const Worker = Cloudflare.Worker("DearlyWorker", {
  main: "../apps/worker/src/index.ts",
  compatibility: { flags: ["nodejs_compat"] },
  env: {
    DB: Database,
    MEDIA: Bucket,
    APP_ENV,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    SESSION_SECRET,
  },
});

export type WorkerEnv = Cloudflare.InferEnv<typeof Worker>;

export default Alchemy.Stack(
  "Dearly",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const worker = yield* Worker;
    return { url: worker.url };
  }),
);
