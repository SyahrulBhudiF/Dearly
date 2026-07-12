import {
  type CalendarDate,
  type CalendarMonth,
  DiaryEntry,
  EntryPreview,
  type OwnerSession,
  SaveEntryPayload,
} from "@dearly/domain";
import { and, between, eq } from "drizzle-orm";
import { DateTime, Effect, Option, Schema } from "effect";
import { getDb } from "../database/client";
import { diaryEntries } from "../database/schema";
import type { WorkerEffect } from "../libs/http";
import type { WorkerContext } from "../types";

export type EntryPreviewResult = Schema.Schema.Type<typeof EntryPreview>;
export type DiaryEntryResult = Schema.Schema.Type<typeof DiaryEntry>;
export type SaveEntryInput = Schema.Schema.Type<typeof SaveEntryPayload>;

export const listMonthEntries = (
  context: WorkerContext,
  owner: OwnerSession,
  month: CalendarMonth,
): WorkerEffect<ReadonlyArray<EntryPreviewResult>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed([]);
  }

  return Effect.promise(() =>
    db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.ownerId, owner.ownerId),
          between(diaryEntries.entryDate, `${month}-01`, `${month}-31`),
        ),
      )
      .orderBy(diaryEntries.entryDate),
  ).pipe(Effect.map((rows) => rows.flatMap((row) => optionToArray(toPreview(row)))));
};

export const getEntryByDate = (
  context: WorkerContext,
  owner: OwnerSession,
  date: CalendarDate,
): WorkerEffect<Option.Option<DiaryEntryResult>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() =>
    db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.ownerId, owner.ownerId), eq(diaryEntries.entryDate, date)))
      .limit(1),
  ).pipe(Effect.map((rows) => (rows.length === 0 ? Option.none() : toEntry(rows[0]!))));
};

export const saveEntry = (
  context: WorkerContext,
  owner: OwnerSession,
  payload: SaveEntryInput,
): WorkerEffect<DiaryEntryResult> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.die(new Error("D1 DB binding is required to save entries"));
  }

  const updatedAt = DateTime.formatIso(DateTime.nowUnsafe());

  return Effect.promise(() =>
    db
      .insert(diaryEntries)
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
        target: [diaryEntries.ownerId, diaryEntries.entryDate],
        set: {
          documentJson: payload.document,
          previewSnippet: payload.preview.snippet ?? null,
          previewThumbnailMediaObjectId: payload.preview.thumbnailMediaObjectId ?? null,
          updatedAt,
        },
      })
      .returning(),
  ).pipe(Effect.map((rows) => Option.getOrThrow(toEntry(rows[0]!))));
};

const toPreview = (row: typeof diaryEntries.$inferSelect) =>
  Schema.decodeUnknownOption(EntryPreview)({
    date: row.entryDate,
    snippet: row.previewSnippet ?? undefined,
    thumbnailMediaObjectId: row.previewThumbnailMediaObjectId ?? undefined,
    hasSavedEntry: true,
    hasDraft: false,
  });

const toEntry = (row: typeof diaryEntries.$inferSelect) =>
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

const optionToArray = <A>(option: Option.Option<A>): ReadonlyArray<A> =>
  Option.match(option, { onNone: () => [], onSome: (value) => [value] });
