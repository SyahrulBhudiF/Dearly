import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

const Database = Cloudflare.D1.Database("DearlyDB", {
  migrationsDir: "./drizzle",
  migrationsTable: "drizzle_migrations",
});

const Bucket = Cloudflare.R2.Bucket("DearlyMedia");

const APP_ENV = Config.string("APP_ENV").pipe(Config.withDefault("development"));
const ACCESS_TEAM_DOMAIN = Config.string("CF_ACCESS_TEAM_DOMAIN");
const ACCESS_OWNER_EMAILS = Config.string("CF_ACCESS_OWNER_EMAILS").pipe(
  Config.map((emails) =>
    emails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean),
  ),
);
const DEARLY_DOMAIN = Config.string("DEARLY_DOMAIN");

const DEV_OWNER_ID = Config.string("DEV_OWNER_ID").pipe(Config.withDefault("dev-owner"));

const workerEnv = {
  DB: Database,
  MEDIA: Bucket,
  APP_ENV,
  DEV_OWNER_ID,
  CF_ACCESS_TEAM_DOMAIN: ACCESS_TEAM_DOMAIN,
};

export type WorkerEnv = Cloudflare.InferEnv<typeof workerEnv> & {
  readonly CF_ACCESS_AUD: string;
  readonly ASSETS: Fetcher;
};

export default Alchemy.Stack(
  "Dearly",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const domain = yield* DEARLY_DOMAIN;
    const accessPolicy = yield* Cloudflare.Access.Policy("DearlyOwner", {
      name: "Dearly owner",
      decision: "allow",
      include: yield* ACCESS_OWNER_EMAILS.pipe(
        Config.map((emails) => emails.map((email) => ({ email: { email } }))),
      ),
    });
    const accessApplication = yield* Cloudflare.Access.Application("Dearly", {
      name: "Dearly",
      type: "self_hosted",
      domain,
      policies: [accessPolicy.policyId],
      sessionDuration: "24h",
    });
    const worker = yield* Cloudflare.Worker("DearlyWorker", {
      main: "./src/index.ts",
      assets: "../web/dist",
      compatibility: { flags: ["nodejs_compat"] },
      domain,
      env: {
        ...workerEnv,
        CF_ACCESS_AUD: accessApplication.aud,
      },
      dev: {
        port: 3000,
        strictPort: true
      },
    });

    return { url: worker.url };
  }),
);
