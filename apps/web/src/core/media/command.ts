import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import * as rpc from "../rpc";
import {
  FailedToUpload,
  LoadedImages,
  LoadedStickers,
  UploadedImage,
  UploadedSticker,
} from "./message";

export const loadStickers = Command.define(
  "loadStickers",
  LoadedStickers,
  FailedToUpload,
)(
  rpc.listStickers.pipe(
    Effect.map((stickers) => LoadedStickers({ stickers })),
    Effect.catch(() => Effect.succeed(FailedToUpload())),
  ),
);

export const loadImages = Command.define(
  "loadImages",
  LoadedImages,
  FailedToUpload,
)(
  rpc.listImages.pipe(
    Effect.map((images) => LoadedImages({ images })),
    Effect.catch(() => Effect.succeed(FailedToUpload())),
  ),
);

export const uploadImage = Command.define(
  "uploadImage",
  { file: Schema.Any, title: Schema.String },
  UploadedImage,
  FailedToUpload,
)(({ file, title }) =>
  rpc.uploadImage(file as File).pipe(
    Effect.map((mediaObjectId) => UploadedImage({ mediaObjectId, title })),
    Effect.catch(() => Effect.succeed(FailedToUpload())),
  ),
);

export const uploadSticker = Command.define(
  "uploadSticker",
  { file: Schema.Any, title: Schema.String },
  UploadedSticker,
  FailedToUpload,
)(({ file, title }) =>
  rpc.uploadImage(file as File).pipe(
    Effect.flatMap((mediaObjectId) => rpc.createSticker(mediaObjectId, title)),
    Effect.map((sticker) => UploadedSticker({ sticker })),
    Effect.catch(() => Effect.succeed(FailedToUpload())),
  ),
);
