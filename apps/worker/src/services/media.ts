import {
  BadRequest,
  CreateMediaUploadPayload,
  DatabaseError,
  MediaObject,
  MediaObjectId,
  MediaNotFound,
  MediaTooLarge,
  MediaUpload,
  NotFound,
  StorageError,
  Unauthorized,
  UnsupportedMediaType,
} from "@dearly/domain";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { json } from "../http";
import { requireOwner, getSession } from "../session";
import type { PrivateMedia } from "./mediaStorage";
import { MediaStorageService } from "./mediaStorage";
import { DatabaseService } from "./database";
import type { ConfigService } from "./config";
import type { RequestService } from "./appLayer";

export { type PrivateMedia };

export const maxMediaBytes = 10 * 1024 * 1024;
export const allowedMediaMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type CreateMediaInput = typeof CreateMediaUploadPayload.Type;

const decodeMediaId = (request: Request) => {
  const id = new URL(request.url).pathname.slice("/media/".length);
  return Schema.decodeUnknownOption(MediaObjectId)(id);
};

interface MediaServiceShape {
  createMediaUpload: (
    input: CreateMediaInput,
  ) => Effect.Effect<
    MediaUpload,
    MediaTooLarge | UnsupportedMediaType | Unauthorized | DatabaseError,
    ConfigService | RequestService
  >;
  getMediaObject: (
    id: MediaObjectId,
  ) => Effect.Effect<
      Option.Option<MediaObject>,
      Unauthorized | DatabaseError,
      ConfigService | RequestService
    >;
  listImages: () => Effect.Effect<
    ReadonlyArray<MediaObject>,
    Unauthorized | DatabaseError,
    ConfigService | RequestService
  >;
  uploadPrivateMedia: (
    id: MediaObjectId,
    body: ReadableStream | null,
  ) => Effect.Effect<
      Option.Option<MediaObject>,
      Unauthorized | DatabaseError | StorageError,
      ConfigService | RequestService
    >;
  getPrivateMedia: (
    id: MediaObjectId,
  ) => Effect.Effect<
      Option.Option<PrivateMedia>,
      Unauthorized | DatabaseError | StorageError,
      ConfigService | RequestService
    >;
  serveMedia: (
    request: Request,
  ) => Effect.Effect<
    Response,
    BadRequest | MediaNotFound | NotFound | Unauthorized | DatabaseError | StorageError,
    ConfigService | RequestService
  >;
}

export class MediaService extends Context.Service<MediaService, MediaServiceShape>()(
  "MediaService",
) {}

export const MediaLive = Layer.effect(
  MediaService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;
    const storage = yield* MediaStorageService;

    const _uploadPrivateMedia = Effect.fn("MediaService.uploadPrivateMedia")(function* (
      id: MediaObjectId,
      body: ReadableStream | null,
    ) {
      const owner = yield* requireOwner;
      const media = yield* db.findMediaById(owner, id);
      if (Option.isNone(media)) return Option.none<MediaObject>();
      yield* storage.put(media.value.r2Key, body);
      return Option.some(media.value);
    });

    const _getPrivateMedia = Effect.fn("MediaService.getPrivateMedia")(function* (
      id: MediaObjectId,
    ) {
      const owner = yield* requireOwner;
      const media = yield* db.findMediaById(owner, id);
      if (Option.isNone(media)) return Option.none<PrivateMedia>();
      const body = yield* storage.get(media.value.r2Key);
      if (Option.isNone(body)) return Option.none<PrivateMedia>();
      return Option.some<PrivateMedia>({ body: body.value, mimeType: media.value.mimeType });
    });

    return MediaService.of({
      createMediaUpload: Effect.fn("MediaService.createMediaUpload")(function* (
        payload: CreateMediaInput,
      ) {
        if (payload.sizeBytes > maxMediaBytes) {
          return yield* Effect.fail(
            new MediaTooLarge({
              maxBytes: maxMediaBytes,
              actualBytes: payload.sizeBytes,
              message: "Media file is too large",
            }),
          );
        }
        if (!allowedMediaMimeTypes.has(payload.mimeType)) {
          return yield* Effect.fail(
            new UnsupportedMediaType({
              mimeType: payload.mimeType,
              message: "Media MIME type is not allowed",
            }),
          );
        }

        const owner = yield* requireOwner;
        const media = yield* db.insertMedia(owner, payload);

        return MediaUpload.make({
          mediaObjectId: media.id,
          uploadUrl: `/media/${media.id}`,
          r2Key: media.r2Key,
        });
      }),

      getMediaObject: Effect.fn("MediaService.getMediaObject")(function* (id: MediaObjectId) {
        const owner = yield* requireOwner;
        return yield* db.findMediaById(owner, id);
      }),

      listImages: Effect.fn("MediaService.listImages")(function* () {
        const owner = yield* requireOwner;
        return yield* db.listImagesByOwner(owner);
      }),

      uploadPrivateMedia: Effect.fn("MediaService.uploadPrivateMedia")(function* (
        id: MediaObjectId,
        body: ReadableStream | null,
      ) {
        const owner = yield* requireOwner;
        const media = yield* db.findMediaById(owner, id);
        if (Option.isNone(media)) return Option.none<MediaObject>();
        yield* storage.put(media.value.r2Key, body);
        return Option.some(media.value);
      }),

      getPrivateMedia: Effect.fn("MediaService.getPrivateMedia")(function* (id: MediaObjectId) {
        const owner = yield* requireOwner;
        const media = yield* db.findMediaById(owner, id);
        if (Option.isNone(media)) return Option.none<PrivateMedia>();
        const body = yield* storage.get(media.value.r2Key);
        if (Option.isNone(body)) return Option.none<PrivateMedia>();
        return Option.some<PrivateMedia>({ body: body.value, mimeType: media.value.mimeType });
      }),

      serveMedia: Effect.fn("MediaService.serveMedia")(function* (request: Request) {
        const id = decodeMediaId(request);
        if (Option.isNone(id)) {
          return yield* Effect.fail(new NotFound({ message: "Media not found" }));
        }

        const session = yield* getSession;

        if (Option.isNone(session)) {
          return yield* Effect.fail(new Unauthorized({ message: "Owner session is required" }));
        }

        if (request.method === "POST") {
          if (request.body === null) {
            return yield* Effect.fail(new BadRequest({ message: "Missing upload body" }));
          }
          const uploaded = yield* _uploadPrivateMedia(id.value, request.body);
          if (Option.isNone(uploaded)) {
            return yield* Effect.fail(
              new MediaNotFound({ mediaObjectId: id.value, message: "Media not found" }),
            );
          }
          return yield* json(200, uploaded.value);
        }

        const result = yield* _getPrivateMedia(id.value);

        if (Option.isNone(result)) {
          return yield* Effect.fail(
            new MediaNotFound({ mediaObjectId: id.value, message: "Media not found" }),
          );
        }

        return new Response(result.value.body.body, {
          status: 200,
          headers: {
            "content-type": result.value.mimeType,
            "cache-control": "private, max-age=3600",
            "x-content-type-options": "nosniff",
          },
        });
      }),
    });
  }),
);
