import { Schema } from "effect";

const uuid = <const Brand extends string>(brand: Brand) =>
  Schema.String.check(Schema.isUUID()).pipe(Schema.brand(brand));

export const OwnerId = Schema.String.pipe(Schema.brand("@Dearly/OwnerId"));
export type OwnerId = typeof OwnerId.Type;

export const DiaryEntryId = uuid("@Dearly/DiaryEntryId");
export type DiaryEntryId = typeof DiaryEntryId.Type;

export const CanvasElementId = uuid("@Dearly/CanvasElementId");
export type CanvasElementId = typeof CanvasElementId.Type;

export const MediaObjectId = uuid("@Dearly/MediaObjectId");
export type MediaObjectId = typeof MediaObjectId.Type;

export const StickerId = uuid("@Dearly/StickerId");
export type StickerId = typeof StickerId.Type;
