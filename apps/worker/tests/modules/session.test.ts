import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Option } from "effect";
import { getSession } from "../../src/session";
import { ConfigLive } from "../../src/services/config";
import { RequestService } from "../../src/services/appLayer";
import { ownerId, testRequest } from "../fakes";

const devLayer = Layer.mergeAll(
  ConfigLive({ APP_ENV: "test", DEV_OWNER_ID: ownerId }),
  Layer.succeed(RequestService, testRequest),
);

const prodLayer = Layer.mergeAll(
  ConfigLive({ APP_ENV: "production" }),
  Layer.succeed(RequestService, testRequest),
);

describe("session module", () => {
  it.effect("returns the configured development owner", () =>
    Effect.gen(function*() {
      const session = yield* getSession;
      expect(Option.getOrThrow(session)).toEqual({ ownerId });
    }).pipe(Effect.provide(devLayer)),
  );

  it.effect("returns none outside development without a validated Access token", () =>
    Effect.gen(function*() {
      const session = yield* getSession;
      expect(Option.isNone(session)).toBe(true);
    }).pipe(Effect.provide(prodLayer)),
  );
});
