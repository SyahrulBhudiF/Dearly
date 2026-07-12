import { describe, expect, it } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { loadConfig } from "../src/config";

describe("worker config", () => {
  it("uses safe defaults when optional secrets are absent", async () => {
    const config = await Effect.runPromise(loadConfig({}));

    expect(config.appEnv).toBe("development");
    expect(Option.isNone(config.sessionSecret)).toBe(true);
  });

  it("loads Cloudflare string env as Effect config", async () => {
    const config = await Effect.runPromise(
      loadConfig({ APP_ENV: "production", SESSION_SECRET: "secret" }),
    );

    expect(config.appEnv).toBe("production");
    expect(Option.map(config.sessionSecret, Redacted.value)).toEqual(Option.some("secret"));
  });
});
