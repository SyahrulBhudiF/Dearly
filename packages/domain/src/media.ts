import { Schema } from "effect";
import { MediaObjectId, OwnerId, StickerId } from "./ids";

const NonNegativeNumber = Schema.Number.check(Schema.isGreaterThanOrEqualTo(0));

export const MediaKind = Schema.Literals(["image", "sticker", "thumbnail"]);
export type MediaKind = Schema.Schema.Type<typeof MediaKind>;

export const MediaObject = Schema.Struct({
  id: MediaObjectId,
  ownerId: OwnerId,
  kind: MediaKind,
  r2Key: Schema.String,
  name: Schema.String,
  mimeType: Schema.String,
  sizeBytes: NonNegativeNumber,
  createdAt: Schema.DateTimeUtc,
});
export type MediaObject = Schema.Schema.Type<typeof MediaObject>;

export const Sticker = Schema.Struct({
  id: StickerId,
  ownerId: OwnerId,
  mediaObjectId: MediaObjectId,
  label: Schema.String,
  createdAt: Schema.DateTimeUtc,
});
export type Sticker = Schema.Schema.Type<typeof Sticker>;

export const CreateMediaUploadPayload = Schema.Struct({
  kind: MediaKind,
  name: Schema.String,
  mimeType: Schema.String,
  sizeBytes: NonNegativeNumber,
});
export type CreateMediaUploadPayload = Schema.Schema.Type<typeof CreateMediaUploadPayload>;

export const MediaUpload = Schema.Struct({
  mediaObjectId: MediaObjectId,
  uploadUrl: Schema.String,
  r2Key: Schema.String,
});
export type MediaUpload = Schema.Schema.Type<typeof MediaUpload>;
