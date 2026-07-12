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
import { Effect } from "effect";

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

export const appErrorToResponse = (error: AppError) => {
  switch (error._tag) {
    case "BadRequest":
      return jsonResponse(400, error);
    case "Unauthorized":
      return jsonResponse(401, error);
    case "EntryNotFound":
    case "MediaNotFound":
    case "NotFound":
    case "StickerNotFound":
      return jsonResponse(404, error);
    case "MediaTooLarge":
      return jsonResponse(413, error);
    case "UnsupportedMediaType":
      return jsonResponse(415, error);
  }
};
