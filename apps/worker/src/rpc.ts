import {
  CalendarDate,
  CalendarMonth,
  CreateMediaUploadPayload,
  MediaObjectId,
  type OwnerSession,
  SaveEntryPayload,
  Unauthorized,
} from "@dearly/domain";
import { Effect, Option, Schema } from "effect";
import { json, notImplemented, type WorkerEffect } from "./libs/http";
import { getEntryByDate, listMonthEntries, saveEntry } from "./modules/entry";
import {
  allowedMediaMimeTypes,
  createMediaUpload,
  getMediaObject,
  maxMediaBytes,
} from "./modules/media";
import { getSession } from "./modules/session";
import type { WorkerContext } from "./types";

export const rpc = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const procedure = new URL(request.url).pathname.slice("/rpc/".length);

  switch (procedure) {
    case "getSession":
      return getSession(context).pipe(
        Effect.flatMap(
          Option.match({
            onNone: () => json(200, null),
            onSome: (session) => json(200, session),
          }),
        ),
      );

    case "listMonthEntries":
      return withOwner(context, (owner) =>
        readJson(request).pipe(
          Effect.flatMap((body) =>
            Option.match(
              Schema.decodeUnknownOption(Schema.Struct({ month: CalendarMonth }))(body),
              {
                onNone: badPayload,
                onSome: ({ month }) =>
                  listMonthEntries(context, owner, month).pipe(
                    Effect.flatMap((previews) => json(200, previews)),
                  ),
              },
            ),
          ),
        ),
      );

    case "getEntryByDate":
      return withOwner(context, (owner) =>
        readJson(request).pipe(
          Effect.flatMap((body) =>
            Option.match(Schema.decodeUnknownOption(Schema.Struct({ date: CalendarDate }))(body), {
              onNone: badPayload,
              onSome: ({ date }) =>
                getEntryByDate(context, owner, date).pipe(
                  Effect.flatMap(
                    Option.match({
                      onNone: () =>
                        json(404, { error: "EntryNotFound", date, message: "Entry not found" }),
                      onSome: (entry) => json(200, entry),
                    }),
                  ),
                ),
            }),
          ),
        ),
      );

    case "saveEntry":
      return withOwner(context, (owner) =>
        readJson(request).pipe(
          Effect.flatMap((body) =>
            Option.match(Schema.decodeUnknownOption(SaveEntryPayload)(body), {
              onNone: badPayload,
              onSome: (payload) =>
                saveEntry(context, owner, payload).pipe(
                  Effect.flatMap((entry) => json(200, entry)),
                ),
            }),
          ),
        ),
      );

    case "createMediaUpload":
      return withOwner(context, (owner) =>
        readJson(request).pipe(
          Effect.flatMap((body) =>
            Option.match(Schema.decodeUnknownOption(CreateMediaUploadPayload)(body), {
              onNone: badPayload,
              onSome: (payload) =>
                validateMediaPayload(payload) ??
                createMediaUpload(context, owner, payload).pipe(
                  Effect.flatMap((upload) => json(200, upload)),
                ),
            }),
          ),
        ),
      );

    case "getMediaObject":
      return withOwner(context, (owner) =>
        readJson(request).pipe(
          Effect.flatMap((body) =>
            Option.match(
              Schema.decodeUnknownOption(Schema.Struct({ mediaObjectId: MediaObjectId }))(body),
              {
                onNone: badPayload,
                onSome: ({ mediaObjectId }) =>
                  getMediaObject(context, owner, mediaObjectId).pipe(
                    Effect.flatMap(
                      Option.match({
                        onNone: () => json(404, { error: "NotFound", message: "Media not found" }),
                        onSome: (media) => json(200, media),
                      }),
                    ),
                  ),
              },
            ),
          ),
        ),
      );

    default:
      return notImplemented(`RPC procedure is not wired yet: ${procedure}`);
  }
};

const withOwner = (
  context: WorkerContext,
  use: (owner: OwnerSession) => WorkerEffect<Response>,
): WorkerEffect<Response> =>
  getSession(context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => json(401, new Unauthorized({ message: "Owner session is required" })),
        onSome: use,
      }),
    ),
  );

const readJson = (request: Request): WorkerEffect<unknown> => Effect.promise(() => request.json());

const validateMediaPayload = (payload: Schema.Schema.Type<typeof CreateMediaUploadPayload>) => {
  if (payload.sizeBytes > maxMediaBytes) {
    return json(413, {
      error: "MediaTooLarge",
      maxBytes: maxMediaBytes,
      actualBytes: payload.sizeBytes,
      message: "Media file is too large",
    });
  }

  if (!allowedMediaMimeTypes.has(payload.mimeType)) {
    return json(415, {
      error: "UnsupportedMediaType",
      message: "Media MIME type is not allowed",
    });
  }

  return undefined;
};

const badPayload = () => json(400, { error: "BadRequest", message: "Invalid RPC payload" });
