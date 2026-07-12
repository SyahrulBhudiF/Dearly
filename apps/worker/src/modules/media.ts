import {
  CreateMediaUploadPayload,
  MediaObject,
  type MediaObjectId,
  MediaTooLarge,
  MediaUpload,
  UnsupportedMediaType,
  type OwnerSession,
} from "@dearly/domain";
import { and, desc, eq } from "drizzle-orm";
import { DateTime, Effect, Option, Schema } from "effect";
import { getDb } from "../database/client";
import { mediaObjects } from "../database/schema";
import type { WorkerEffect } from "../libs/http";
import type { R2ObjectBody, WorkerContext } from "../types";

export const maxMediaBytes = 10 * 1024 * 1024;
export const allowedMediaMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type MediaRow = typeof mediaObjects.$inferSelect;

export interface PrivateMedia {
  readonly body: R2ObjectBody;
  readonly mimeType: string;
}

export type CreateMediaInput = Schema.Schema.Type<typeof CreateMediaUploadPayload>;
export type MediaObjectResult = Schema.Schema.Type<typeof MediaObject>;
export type MediaUploadResult = Schema.Schema.Type<typeof MediaUpload>;

export const createMediaUpload = (
  context: WorkerContext,
  owner: OwnerSession,
  payload: CreateMediaInput,
): WorkerEffect<MediaUploadResult> => {
  if (payload.sizeBytes > maxMediaBytes) {
    return Effect.fail(
      new MediaTooLarge({
        maxBytes: maxMediaBytes,
        actualBytes: payload.sizeBytes,
        message: "Media file is too large",
      }),
    );
  }
  if (!allowedMediaMimeTypes.has(payload.mimeType)) {
    return Effect.fail(
      new UnsupportedMediaType({
        mimeType: payload.mimeType,
        message: "Media MIME type is not allowed",
      }),
    );
  }

  const db = getDb(context);
  if (db === undefined) {
    return Effect.die(new Error("D1 DB binding is required to create media"));
  }

  const id = crypto.randomUUID();
  const r2Key = `${owner.ownerId}/${id}`;
  const createdAt = DateTime.formatIso(DateTime.nowUnsafe());

  return Effect.promise(() =>
    db
      .insert(mediaObjects)
      .values({
        id,
        ownerId: owner.ownerId,
        kind: payload.kind,
        r2Key,
        name: payload.name,
        mimeType: payload.mimeType,
        sizeBytes: payload.sizeBytes,
        createdAt,
      })
      .returning(),
  ).pipe(
    Effect.map(() =>
      Schema.decodeUnknownSync(MediaUpload)({
        mediaObjectId: id,
        uploadUrl: `/media/${id}`,
        r2Key,
      }),
    ),
  );
};

export const getMediaObject = (
  context: WorkerContext,
  owner: OwnerSession,
  id: MediaObjectId,
): WorkerEffect<Option.Option<MediaObjectResult>> =>
  findOwnedMedia(context, owner, id).pipe(Effect.map((row) => Option.flatMap(row, toMediaObject)));

export const listImages = (
  context: WorkerContext,
  owner: OwnerSession,
): WorkerEffect<ReadonlyArray<MediaObjectResult>> => {
  const db = getDb(context);
  if (db === undefined) return Effect.succeed([]);
  return Effect.promise(() =>
    db
      .select()
      .from(mediaObjects)
      .where(and(eq(mediaObjects.ownerId, owner.ownerId), eq(mediaObjects.kind, "image")))
      .orderBy(desc(mediaObjects.createdAt)),
  ).pipe(Effect.map((rows) => rows.flatMap((row) => Option.toArray(toMediaObject(row)))));
};

export const uploadPrivateMedia = (
  context: WorkerContext,
  owner: OwnerSession,
  id: MediaObjectId,
  body: ReadableStream,
): WorkerEffect<Option.Option<MediaObjectResult>> => {
  const bucket = context.env.MEDIA;
  if (bucket === undefined) {
    return Effect.succeed(Option.none());
  }

  return findOwnedMedia(context, owner, id).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.succeed(Option.none()),
        onSome: (media) =>
          Effect.promise(() => bucket.put(media.r2Key, body)).pipe(
            Effect.map(() => Option.getOrThrow(toMediaObject(media))),
            Effect.map(Option.some),
          ),
      }),
    ),
  );
};

export const getPrivateMedia = (
  context: WorkerContext,
  owner: OwnerSession,
  id: MediaObjectId,
): WorkerEffect<Option.Option<PrivateMedia>> => {
  const bucket = context.env.MEDIA;
  if (bucket === undefined) {
    return Effect.succeed(Option.none());
  }

  return findOwnedMedia(context, owner, id).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.succeed(Option.none()),
        onSome: (media) =>
          Effect.promise(() => bucket.get(media.r2Key)).pipe(
            Effect.map((body) =>
              body === null ? Option.none() : Option.some({ body, mimeType: media.mimeType }),
            ),
          ),
      }),
    ),
  );
};

const findOwnedMedia = (
  context: WorkerContext,
  owner: OwnerSession,
  id: MediaObjectId,
): WorkerEffect<Option.Option<MediaRow>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() =>
    db
      .select()
      .from(mediaObjects)
      .where(and(eq(mediaObjects.id, id), eq(mediaObjects.ownerId, owner.ownerId)))
      .limit(1),
  ).pipe(Effect.map((rows) => (rows[0] === undefined ? Option.none() : Option.some(rows[0]))));
};

const toMediaObject = (row: MediaRow) =>
  Schema.decodeUnknownOption(MediaObject)({
    id: row.id,
    ownerId: row.ownerId,
    kind: row.kind,
    r2Key: row.r2Key,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: DateTime.makeUnsafe(row.createdAt),
  });
