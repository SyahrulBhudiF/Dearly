import { Schema } from "effect";
import { CalendarDate } from "./calendar";
import { CanvasDocument } from "./canvas";
import { DiaryEntryId, MediaObjectId, OwnerId } from "./ids";

export const EntryPreview = Schema.Struct({
  date: CalendarDate,
  snippet: Schema.optional(Schema.String),
  thumbnailMediaObjectId: Schema.optional(MediaObjectId),
  hasSavedEntry: Schema.Boolean,
  hasDraft: Schema.Boolean,
});
export type EntryPreview = typeof EntryPreview.Type;

export const DiaryEntry = Schema.Struct({
  id: DiaryEntryId,
  ownerId: OwnerId,
  date: CalendarDate,
  document: CanvasDocument,
  preview: EntryPreview,
  updatedAt: Schema.DateTimeUtc,
});
export type DiaryEntry = typeof DiaryEntry.Type;

export const SaveEntryPayload = Schema.Struct({
  date: CalendarDate,
  document: CanvasDocument,
  preview: EntryPreview,
});
export type SaveEntryPayload = typeof SaveEntryPayload.Type;
