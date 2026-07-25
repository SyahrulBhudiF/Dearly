import { DearlyErrors } from "@dearly/rpc";
import { Effect, Match, Schema } from "effect";
import { NotFound } from "@dearly/domain";
import type { ConfigError } from "effect/Config";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
} as const;

export type AppError = typeof DearlyErrors.Type;

export type WorkerEffect<A> = Effect.Effect<A, AppError>;

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...securityHeaders },
  });

export const json = (status: number, body: unknown): Effect.Effect<Response> =>
  Effect.succeed(jsonResponse(status, body));

export const notFound = (): WorkerEffect<Response> =>
  Effect.fail(new NotFound({ message: "Route not found" }));

export const appErrorToResponse = (error: AppError | ConfigError) =>
  Match.value(error).pipe(
    Match.withReturnType<Response>(),
    Match.tagsExhaustive({
      ConfigError: () =>
        new Response(JSON.stringify({ error: "ConfigError", message: error.message }), {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
      BadRequest: () => jsonResponse(400, error),
      Unauthorized: () => jsonResponse(401, error),
      EntryNotFound: () => jsonResponse(404, error),
      MediaNotFound: () => jsonResponse(404, error),
      NotFound: () => jsonResponse(404, error),
      StickerNotFound: () => jsonResponse(404, error),
      DraftConflict: () => jsonResponse(409, error),
      MediaTooLarge: () => jsonResponse(413, error),
      UnsupportedMediaType: () => jsonResponse(415, error),
      DatabaseError: () => jsonResponse(500, error),
      StorageError: () => jsonResponse(500, error),
    }),
  );
