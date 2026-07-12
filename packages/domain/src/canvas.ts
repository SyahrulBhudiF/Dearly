import { Schema } from "effect";
import { CanvasElementId, MediaObjectId, StickerId } from "./ids";

const PositiveNumber = Schema.Number.check(Schema.isGreaterThan(0));

export const CanvasElementKind = Schema.Literals(["text", "image", "sticker"]);
export type CanvasElementKind = Schema.Schema.Type<typeof CanvasElementKind>;

export const RichTextDocument = Schema.Struct({
  type: Schema.Literal("doc"),
  content: Schema.optional(Schema.Array(Schema.Record(Schema.String, Schema.Unknown))),
});
export type RichTextDocument = Schema.Schema.Type<typeof RichTextDocument>;

export const CanvasElementPayload = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("text"),
    document: RichTextDocument,
  }),
  Schema.Struct({
    kind: Schema.Literal("image"),
    mediaObjectId: MediaObjectId,
    alt: Schema.optional(Schema.String),
  }),
  Schema.Struct({
    kind: Schema.Literal("sticker"),
    stickerId: StickerId,
    mediaObjectId: MediaObjectId,
  }),
]);
export type CanvasElementPayload = Schema.Schema.Type<typeof CanvasElementPayload>;

export const CanvasElement = Schema.Struct({
  id: CanvasElementId,
  payload: CanvasElementPayload,
  x: Schema.Number,
  y: Schema.Number,
  width: PositiveNumber,
  height: PositiveNumber,
  rotation: Schema.Number,
  layer: Schema.Number.check(Schema.isInt()),
});
export type CanvasElement = Schema.Schema.Type<typeof CanvasElement>;

export const CanvasDocument = Schema.Struct({
  version: Schema.Literal(1),
  logicalWidth: PositiveNumber,
  logicalHeight: PositiveNumber,
  elements: Schema.Array(CanvasElement),
});
export type CanvasDocument = Schema.Schema.Type<typeof CanvasDocument>;
