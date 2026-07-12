import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { loadConfig } from "../src/config/env";

describe("worker config", () => {
  it("uses safe defaults when Access config is absent", async () => {
    const config = await Effect.runPromise(loadConfig({}));

    expect(config.appEnv).toBe("development");
    expect(config.timeZone).toBe("Asia/Jakarta");
    expect(Option.isNone(config.access)).toBe(true);
  });

  it("loads Cloudflare Access config", async () => {
    const config = await Effect.runPromise(
      loadConfig({
        APP_ENV: "production",
        CF_ACCESS_AUD: "access-audience",
        CF_ACCESS_TEAM_DOMAIN: "https://dearly.cloudflareaccess.com",
      }),
    );

    expect(config.access).toEqual(
      Option.some({ aud: "access-audience", teamDomain: "https://dearly.cloudflareaccess.com" }),
    );
  });
});
