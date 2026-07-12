import { Schema } from "effect";
import { CalendarDate } from "./calendar";
import { MediaObjectId, StickerId } from "./ids";

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()("Unauthorized", {
  message: Schema.String,
}) {}

export class EntryNotFound extends Schema.TaggedErrorClass<EntryNotFound>()("EntryNotFound", {
  date: CalendarDate,
  message: Schema.String,
}) {}

export class BadRequest extends Schema.TaggedErrorClass<BadRequest>()("BadRequest", {
  message: Schema.String,
}) {}

export class NotFound extends Schema.TaggedErrorClass<NotFound>()("NotFound", {
  message: Schema.String,
}) {}

export class MediaNotFound extends Schema.TaggedErrorClass<MediaNotFound>()("MediaNotFound", {
  mediaObjectId: MediaObjectId,
  message: Schema.String,
}) {}

export class StickerNotFound extends Schema.TaggedErrorClass<StickerNotFound>()("StickerNotFound", {
  stickerId: StickerId,
  message: Schema.String,
}) {}

export class MediaTooLarge extends Schema.TaggedErrorClass<MediaTooLarge>()("MediaTooLarge", {
  maxBytes: Schema.Number,
  actualBytes: Schema.Number,
  message: Schema.String,
}) {}

export class UnsupportedMediaType extends Schema.TaggedErrorClass<UnsupportedMediaType>()(
  "UnsupportedMediaType",
  {
    mimeType: Schema.String,
    message: Schema.String,
  },
) {}

export class DraftConflict extends Schema.TaggedErrorClass<DraftConflict>()("DraftConflict", {
  date: CalendarDate,
  message: Schema.String,
}) {}
