import { Schema } from "effect";
import { MediaObjectId, OwnerId, StickerId } from "./ids";

const NonNegativeNumber = Schema.Number.check(Schema.isGreaterThanOrEqualTo(0));

export const MediaKind = Schema.Literals(["image", "sticker", "thumbnail"]);
export type MediaKind = typeof MediaKind.Type;

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
export type MediaObject = typeof MediaObject.Type;

export const Sticker = Schema.Struct({
  id: StickerId,
  ownerId: OwnerId,
  mediaObjectId: MediaObjectId,
  label: Schema.String,
  createdAt: Schema.DateTimeUtc,
});
export type Sticker = typeof Sticker.Type;

export const CreateMediaUploadPayload = Schema.Struct({
  kind: MediaKind,
  name: Schema.String,
  mimeType: Schema.String,
  sizeBytes: NonNegativeNumber,
});
export type CreateMediaUploadPayload = typeof CreateMediaUploadPayload.Type;

export const MediaUpload = Schema.Struct({
  mediaObjectId: MediaObjectId,
  uploadUrl: Schema.String,
  r2Key: Schema.String,
});
export type MediaUpload = typeof MediaUpload.Type;
