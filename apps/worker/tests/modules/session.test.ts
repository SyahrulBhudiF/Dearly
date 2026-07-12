import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { getSession } from "../../src/modules/session";
import { context, ownerId } from "../fakes";

describe("session module", () => {
  it("returns the configured development owner", async () => {
    const session = await Effect.runPromise(getSession(context()));
    expect(Option.getOrThrow(session)).toEqual({ ownerId });
  });

  it("returns none outside development without a validated Access token", async () => {
    const session = await Effect.runPromise(
      getSession({ ...context(), config: { ...context().config, appEnv: "production" } }),
    );
    expect(Option.isNone(session)).toBe(true);
  });
});
