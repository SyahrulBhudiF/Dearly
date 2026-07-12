import { Schema } from "effect";

const uuid = <const Brand extends string>(brand: Brand) =>
  Schema.String.check(Schema.isUUID()).pipe(Schema.brand(brand));

export const OwnerId = uuid("@Dearly/OwnerId");
export type OwnerId = Schema.Schema.Type<typeof OwnerId>;

export const DiaryEntryId = uuid("@Dearly/DiaryEntryId");
export type DiaryEntryId = Schema.Schema.Type<typeof DiaryEntryId>;

export const CanvasElementId = uuid("@Dearly/CanvasElementId");
export type CanvasElementId = Schema.Schema.Type<typeof CanvasElementId>;

export const MediaObjectId = uuid("@Dearly/MediaObjectId");
export type MediaObjectId = Schema.Schema.Type<typeof MediaObjectId>;

export const StickerId = uuid("@Dearly/StickerId");
export type StickerId = Schema.Schema.Type<typeof StickerId>;
