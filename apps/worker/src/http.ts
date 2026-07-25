import {
  BadRequest,
  EntryNotFound,
  MediaNotFound,
  MediaTooLarge,
  NotFound,
  StickerNotFound,
  Unauthorized,
  UnsupportedMediaType,
} from "@dearly/domain";
import { Effect, Match } from "effect";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
} as const;

type AppError =
  | BadRequest
  | EntryNotFound
  | MediaNotFound
  | MediaTooLarge
  | NotFound
  | StickerNotFound
  | Unauthorized
  | UnsupportedMediaType;

export type WorkerEffect<A> = Effect.Effect<A, AppError>;

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...securityHeaders },
  });

export const json = (status: number, body: unknown): WorkerEffect<Response> =>
  Effect.succeed(jsonResponse(status, body));

export const notFound = (): WorkerEffect<Response> =>
  Effect.fail(new NotFound({ message: "Route not found" }));

export const notImplemented = (message: string) => json(501, { error: "NotImplemented", message });

export const appErrorToResponse = (error: AppError) =>
  Match.value(error).pipe(
    Match.withReturnType<Response>(),
    Match.tagsExhaustive({
      BadRequest: () => jsonResponse(400, error),
      Unauthorized: () => jsonResponse(401, error),
      EntryNotFound: () => jsonResponse(404, error),
      MediaNotFound: () => jsonResponse(404, error),
      NotFound: () => jsonResponse(404, error),
      StickerNotFound: () => jsonResponse(404, error),
      MediaTooLarge: () => jsonResponse(413, error),
      UnsupportedMediaType: () => jsonResponse(415, error),
    }),
  );
