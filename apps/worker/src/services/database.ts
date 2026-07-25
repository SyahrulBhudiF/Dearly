import {
  DiaryEntry,
  EntryPreview,
  MediaObject,
  Sticker,
  type OwnerSession,
  type CalendarDate,
  type CalendarMonth,
  type CreateMediaUploadPayload,
  type MediaObjectId,
  type SaveEntryPayload,
  type StickerId,
} from "@dearly/domain";
import { drizzle } from "drizzle-orm/d1";
import { and, between, desc, eq } from "drizzle-orm";
import { Context, DateTime, Effect, Layer, Match, Option, Schema } from "effect";
import * as schema from "../database/schema";

type DRow = typeof schema.diaryEntries.$inferSelect;
type MRow = typeof schema.mediaObjects.$inferSelect;
type SRow = typeof schema.stickers.$inferSelect;

export interface DatabaseServiceShape {
  readonly listMonthEntries: (
    owner: OwnerSession,
    month: CalendarMonth,
  ) => Effect.Effect<ReadonlyArray<EntryPreview>>;
  readonly findEntryByDate: (
    owner: OwnerSession,
    date: CalendarDate,
  ) => Effect.Effect<Option.Option<DiaryEntry>>;
  readonly saveEntry: (
    owner: OwnerSession,
    payload: SaveEntryPayload,
  ) => Effect.Effect<DiaryEntry, never>;
  readonly deleteEntryByDate: (owner: OwnerSession, date: CalendarDate) => Effect.Effect<void>;
  readonly insertMedia: (
    owner: OwnerSession,
    params: CreateMediaUploadPayload,
  ) => Effect.Effect<MediaObject, never>;
  readonly findMediaById: (
    owner: OwnerSession,
    id: MediaObjectId,
  ) => Effect.Effect<Option.Option<MediaObject>>;
  readonly listImagesByOwner: (owner: OwnerSession) => Effect.Effect<ReadonlyArray<MediaObject>>;
  readonly listStickersByOwner: (owner: OwnerSession) => Effect.Effect<ReadonlyArray<Sticker>>;
  readonly insertSticker: (
    owner: OwnerSession,
    mediaObjectId: MediaObjectId,
    label: string,
  ) => Effect.Effect<Sticker, never>;
  readonly deleteSticker: (owner: OwnerSession, stickerId: StickerId) => Effect.Effect<void>;
}

export class DatabaseService extends Context.Service<DatabaseService, DatabaseServiceShape>()(
  "DatabaseService",
) {}

export const DatabaseLive = (d1Binding: D1Database) =>
  Layer.sync(DatabaseService, function () {
    const db = drizzle(d1Binding, { schema });

    return DatabaseService.of({
      listMonthEntries: Effect.fn("DatabaseService.listMonthEntries")(function* (
        owner: OwnerSession,
        month: CalendarMonth,
      ) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(schema.diaryEntries)
            .where(
              and(
                eq(schema.diaryEntries.ownerId, owner.ownerId),
                between(schema.diaryEntries.entryDate, `${month}-01`, `${month}-31`),
              ),
            )
            .orderBy(schema.diaryEntries.entryDate),
        );
        return rows.flatMap((row) => Option.toArray(toPreview(row)));
      }),

      findEntryByDate: Effect.fn("DatabaseService.findEntryByDate")(function* (
        owner: OwnerSession,
        date: CalendarDate,
      ) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(schema.diaryEntries)
            .where(
              and(
                eq(schema.diaryEntries.ownerId, owner.ownerId),
                eq(schema.diaryEntries.entryDate, date),
              ),
            )
            .limit(1),
        );
        return rows.length === 0 ? Option.none() : toEntry(rows[0]!);
      }),

      saveEntry: Effect.fn("DatabaseService.saveEntry")(function* (
        owner: OwnerSession,
        payload: SaveEntryPayload,
      ) {
        const now = yield* DateTime.now;
        const updatedAt = DateTime.formatIso(now);

        const rows = yield* Effect.promise(() =>
          db
            .insert(schema.diaryEntries)
            .values({
              id: crypto.randomUUID(),
              ownerId: owner.ownerId,
              entryDate: payload.date,
              documentJson: payload.document,
              previewSnippet: payload.preview.snippet ?? null,
              previewThumbnailMediaObjectId: payload.preview.thumbnailMediaObjectId ?? null,
              updatedAt,
            })
            .onConflictDoUpdate({
              target: [schema.diaryEntries.ownerId, schema.diaryEntries.entryDate],
              set: {
                documentJson: payload.document,
                previewSnippet: payload.preview.snippet ?? null,
                previewThumbnailMediaObjectId: payload.preview.thumbnailMediaObjectId ?? null,
                updatedAt,
              },
            })
            .returning(),
        );

        return yield* Option.match(toEntry(rows[0]!), {
          onNone: () => Effect.die("Failed to decode saved entry"),
          onSome: Effect.succeed,
        });
      }),

      deleteEntryByDate: Effect.fn("DatabaseService.deleteEntryByDate")(function* (
        owner: OwnerSession,
        date: CalendarDate,
      ) {
        yield* Effect.promise(() =>
          db
            .delete(schema.diaryEntries)
            .where(
              and(
                eq(schema.diaryEntries.ownerId, owner.ownerId),
                eq(schema.diaryEntries.entryDate, date),
              ),
            ),
        );
      }),

      insertMedia: Effect.fn("DatabaseService.insertMedia")(function* (
        owner: OwnerSession,
        params: CreateMediaUploadPayload,
      ) {
        const now = yield* DateTime.now;
        const id = crypto.randomUUID();
        const r2Key = `${owner.ownerId}/${id}`;
        const createdAt = DateTime.formatIso(now);
        const rows = yield* Effect.promise(() =>
          db
            .insert(schema.mediaObjects)
            .values({
              id,
              ownerId: owner.ownerId,
              kind: params.kind,
              r2Key,
              name: params.name,
              mimeType: params.mimeType,
              sizeBytes: params.sizeBytes,
              createdAt,
            })
            .returning(),
        );
        return yield* Option.match(toMediaObject(rows[0]!), {
          onNone: () => Effect.die("Failed to decode inserted media"),
          onSome: Effect.succeed,
        });
      }),

      findMediaById: Effect.fn("DatabaseService.findMediaById")(function* (
        owner: OwnerSession,
        id: MediaObjectId,
      ) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(schema.mediaObjects)
            .where(
              and(eq(schema.mediaObjects.id, id), eq(schema.mediaObjects.ownerId, owner.ownerId)),
            )
            .limit(1),
        );
        return rows[0] === undefined ? Option.none() : toMediaObject(rows[0]);
      }),

      listImagesByOwner: Effect.fn("DatabaseService.listImagesByOwner")(function* (
        owner: OwnerSession,
      ) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(schema.mediaObjects)
            .where(
              and(
                eq(schema.mediaObjects.ownerId, owner.ownerId),
                eq(schema.mediaObjects.kind, "image"),
              ),
            )
            .orderBy(desc(schema.mediaObjects.createdAt)),
        );
        return rows.flatMap((row) => Option.toArray(toMediaObject(row)));
      }),

      listStickersByOwner: Effect.fn("DatabaseService.listStickersByOwner")(function* (
        owner: OwnerSession,
      ) {
        const rows = yield* Effect.promise(() =>
          db
            .select()
            .from(schema.stickers)
            .where(eq(schema.stickers.ownerId, owner.ownerId))
            .orderBy(schema.stickers.createdAt),
        );
        return rows.flatMap((row) => Option.toArray(toSticker(row)));
      }),

      insertSticker: Effect.fn("DatabaseService.insertSticker")(function* (
        owner: OwnerSession,
        mediaObjectId: MediaObjectId,
        label: string,
      ) {
        const now = yield* DateTime.now;
        const createdAt = DateTime.formatIso(now);

        const rows = yield* Effect.promise(() =>
          db
            .insert(schema.stickers)
            .values({
              id: crypto.randomUUID(),
              ownerId: owner.ownerId,
              mediaObjectId,
              label,
              createdAt,
            })
            .returning(),
        );

        return yield* Option.match(toSticker(rows[0]!), {
          onNone: () => Effect.die("Failed to decode inserted sticker"),
          onSome: Effect.succeed,
        });
      }),

      deleteSticker: Effect.fn("DatabaseService.deleteSticker")(function* (
        owner: OwnerSession,
        stickerId: StickerId,
      ) {
        yield* Effect.promise(() =>
          db
            .delete(schema.stickers)
            .where(
              and(eq(schema.stickers.id, stickerId), eq(schema.stickers.ownerId, owner.ownerId)),
            ),
        );
      }),
    });
  });

const toPreview = (row: DRow) =>
  Schema.decodeUnknownOption(EntryPreview)({
    date: row.entryDate,
    snippet: row.previewSnippet ?? undefined,
    thumbnailMediaObjectId: row.previewThumbnailMediaObjectId ?? undefined,
    hasSavedEntry: true,
    hasDraft: false,
  });

const toEntry = (row: DRow) =>
  Option.flatMap(toPreview(row), (preview) =>
    Schema.decodeUnknownOption(DiaryEntry)({
      id: row.id,
      ownerId: row.ownerId,
      date: row.entryDate,
      document: row.documentJson,
      preview,
      updatedAt: DateTime.makeUnsafe(row.updatedAt),
    }),
  );

const toMediaObject = (row: MRow | undefined) =>
  Match.value(row).pipe(
    Match.when(
      (v) => v !== undefined,
      (row) =>
        Schema.decodeUnknownOption(MediaObject)({
          id: row.id,
          ownerId: row.ownerId,
          kind: row.kind,
          r2Key: row.r2Key,
          name: row.name,
          mimeType: row.mimeType,
          sizeBytes: row.sizeBytes,
          createdAt: DateTime.makeUnsafe(row.createdAt),
        }),
    ),
    Match.orElse(() => Option.none()),
  );

const toSticker = (row: SRow) =>
  Schema.decodeUnknownOption(Sticker)({
    id: row.id,
    ownerId: row.ownerId,
    mediaObjectId: row.mediaObjectId,
    label: row.label,
    createdAt: DateTime.makeUnsafe(row.createdAt),
  });
