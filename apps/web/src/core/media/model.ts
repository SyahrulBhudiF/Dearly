import { Schema } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import { MediaObject, Sticker } from "@dearly/domain";

export const Model = Schema.Struct({
  stickers: Schema.Array(Sticker),
  images: Schema.Array(MediaObject),
  imagePopover: Popover.Model,
  imageSearch: Schema.String,
  stickerPopover: Popover.Model,
  stickerSearch: Schema.String,
  emojiSearch: Schema.String,
  emojiList: VirtualList.Model,
  stickerTab: Schema.Literals(["stickers", "emoji"]),
  stickerFileDrop: FileDrop.Model,
  fileDrop: FileDrop.Model,
  uploadDialog: Dialog.Model,
  pendingUpload: Schema.NullOr(
    Schema.Struct({
      file: Schema.Any,
      kind: Schema.Literals(["image", "sticker"]),
      title: Schema.String,
    }),
  ),
  uploadState: Schema.Literals(["idle", "uploading", "failed"]),
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (): Model => ({
  stickers: [],
  images: [],
  imagePopover: Popover.init({ id: "image-picker" }),
  imageSearch: "",
  stickerPopover: Popover.init({ id: "sticker-picker" }),
  stickerSearch: "",
  emojiSearch: "",
  emojiList: VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 }),
  stickerTab: "stickers",
  stickerFileDrop: FileDrop.init({ id: "sticker-media" }),
  fileDrop: FileDrop.init({ id: "entry-media" }),
  uploadDialog: Dialog.init({ id: "upload-title" }),
  pendingUpload: null,
  uploadState: "idle",
});
