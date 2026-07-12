import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { getSession } from "../../src/modules/session";
import { context, ownerId } from "../fakes";

describe("session module", () => {
  it("returns owner session for a valid cookie", async () => {
    const session = await Effect.runPromise(getSession(context()));

    expect(Option.getOrThrow(session)).toEqual({
      ownerId,
      email: "owner@dearly.test",
      displayName: "Owner",
    });
  });

  it("returns none for an invalid or absent session", async () => {
    const invalid = await Effect.runPromise(getSession(context({ hasSession: false })));
    const absent = await Effect.runPromise(getSession({ ...context(), sessionId: Option.none() }));

    expect(Option.isNone(invalid)).toBe(true);
    expect(Option.isNone(absent)).toBe(true);
  });
});
