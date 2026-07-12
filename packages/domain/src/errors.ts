import { Schema } from "effect";
import { CalendarDate } from "./calendar";

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()("Unauthorized", {
  message: Schema.String,
}) {}

export class EntryNotFound extends Schema.TaggedErrorClass<EntryNotFound>()("EntryNotFound", {
  date: CalendarDate,
  message: Schema.String,
}) {}

export class MediaTooLarge extends Schema.TaggedErrorClass<MediaTooLarge>()("MediaTooLarge", {
  maxBytes: Schema.Number,
  actualBytes: Schema.Number,
  message: Schema.String,
}) {}

export class DraftConflict extends Schema.TaggedErrorClass<DraftConflict>()("DraftConflict", {
  date: CalendarDate,
  message: Schema.String,
}) {}
