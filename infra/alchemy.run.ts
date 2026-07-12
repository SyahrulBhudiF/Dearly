import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import { Bucket, Database } from "./cloudflare";

const APP_ENV = Config.string("APP_ENV").pipe(Config.withDefault("production"));
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
      main: "../apps/worker/src/index.ts",
      assets: "../apps/web/dist",
      compatibility: { flags: ["nodejs_compat"] },
      domain,
      env: {
        DB: Database,
        MEDIA: Bucket,
        APP_ENV,
        CF_ACCESS_AUD: accessApplication.aud,
        CF_ACCESS_TEAM_DOMAIN: ACCESS_TEAM_DOMAIN,
      },
    });
    return { url: worker.url };
  }),
);
