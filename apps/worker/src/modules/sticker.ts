import { MediaObjectId, type OwnerSession, Sticker, StickerId } from "@dearly/domain";
import { and, eq } from "drizzle-orm";
import { DateTime, Effect, Option, Schema } from "effect";
import { getDb } from "../database/client";
import { stickers } from "../database/schema";
import type { WorkerEffect } from "../libs/http";
import type { WorkerContext } from "../types";

export type StickerResult = Schema.Schema.Type<typeof Sticker>;

export const listStickers = (
  context: WorkerContext,
  owner: OwnerSession,
): WorkerEffect<ReadonlyArray<StickerResult>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed([]);
  }

  return Effect.promise(() =>
    db
      .select()
      .from(stickers)
      .where(eq(stickers.ownerId, owner.ownerId))
      .orderBy(stickers.createdAt),
  ).pipe(Effect.map((rows) => rows.flatMap((row) => optionToArray(toSticker(row)))));
};

export const createSticker = (
  context: WorkerContext,
  owner: OwnerSession,
  mediaObjectId: MediaObjectId,
  label: string,
): WorkerEffect<StickerResult> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.die(new Error("D1 DB binding is required to create stickers"));
  }

  const createdAt = DateTime.formatIso(DateTime.nowUnsafe());

  return Effect.promise(() =>
    db
      .insert(stickers)
      .values({
        id: crypto.randomUUID(),
        ownerId: owner.ownerId,
        mediaObjectId,
        label,
        createdAt,
      })
      .returning(),
  ).pipe(Effect.map((rows) => Option.getOrThrow(toSticker(rows[0]!))));
};

export const deleteStickerFromPicker = (
  context: WorkerContext,
  owner: OwnerSession,
  stickerId: StickerId,
): WorkerEffect<void> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.void;
  }

  return Effect.promise(() =>
    db.delete(stickers).where(and(eq(stickers.id, stickerId), eq(stickers.ownerId, owner.ownerId))),
  ).pipe(Effect.asVoid);
};

const toSticker = (row: typeof stickers.$inferSelect) =>
  Schema.decodeUnknownOption(Sticker)({
    id: row.id,
    ownerId: row.ownerId,
    mediaObjectId: row.mediaObjectId,
    label: row.label,
    createdAt: DateTime.makeUnsafe(row.createdAt),
  });

const optionToArray = <A>(option: Option.Option<A>): ReadonlyArray<A> =>
  Option.match(option, { onNone: () => [], onSome: (value) => [value] });
