import { Schema } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import { File } from "foldkit/file";
import { MediaObject, MediaObjectId, Sticker } from "@dearly/domain";
import { Message } from "foldkit";

export const SelectedImage = Message.m("SelectedImage", { file: File });
export const UploadedImage = Message.m("UploadedImage", {
  mediaObjectId: MediaObjectId,
  title: Schema.String,
});
export const FailedToLoadMedia = Message.m("FailedToLoadMedia");
export const FailedToUpload = Message.m("FailedToUploadImage");
export const UploadedSticker = Message.m("UploadedSticker", { sticker: Sticker });
export const GotStickerFileDropMessage = Message.m("GotStickerFileDropMessage", {
  message: FileDrop.Message,
});
export const GotImagePopoverMessage = Message.m("GotImagePopoverMessage", {
  message: Popover.Message,
});
export const LoadedImages = Message.m("LoadedImages", { images: Schema.Array(MediaObject) });
export const SelectedStoredImage = Message.m("SelectedStoredImage", {
  mediaObjectId: MediaObjectId,
});
export const GotStickerPopoverMessage = Message.m("GotStickerPopoverMessage", {
  message: Popover.Message,
});
export const LoadedStickers = Message.m("LoadedStickers", { stickers: Schema.Array(Sticker) });
export const SelectedSticker = Message.m("SelectedSticker", { sticker: Sticker });
export const SelectedEmoji = Message.m("SelectedEmoji", { emoji: Schema.String });
export const SelectedStickerTab = Message.m("SelectedStickerTab", {
  tab: Schema.Literals(["stickers", "emoji"]),
});
export const ChangedImageSearch = Message.m("ChangedImageSearch", { value: Schema.String });
export const ChangedStickerSearch = Message.m("ChangedStickerSearch", { value: Schema.String });
export const ChangedEmojiSearch = Message.m("ChangedEmojiSearch", { value: Schema.String });
export const GotEmojiListMessage = Message.m("GotEmojiListMessage", {
  message: VirtualList.Message,
});
export const GotUploadDialogMessage = Message.m("GotUploadDialogMessage", {
  message: Dialog.Message,
});
export const RequestedUpload = Message.m("RequestedUpload", {
  file: Schema.Any,
  kind: Schema.Literals(["image", "sticker"]),
});
export const ChangedUploadTitle = Message.m("ChangedUploadTitle", { title: Schema.String });
export const ConfirmedUpload = Message.m("ConfirmedUpload");
export const GotFileDropMessage = Message.m("GotFileDropMessage", { message: FileDrop.Message });

export const MediaMessage = Schema.Union([
  SelectedImage,
  UploadedImage,
  FailedToLoadMedia,
  FailedToUpload,
  UploadedSticker,
  GotStickerFileDropMessage,
  GotImagePopoverMessage,
  LoadedImages,
  SelectedStoredImage,
  GotStickerPopoverMessage,
  LoadedStickers,
  SelectedSticker,
  SelectedEmoji,
  SelectedStickerTab,
  ChangedImageSearch,
  ChangedStickerSearch,
  ChangedEmojiSearch,
  GotEmojiListMessage,
  GotUploadDialogMessage,
  RequestedUpload,
  ChangedUploadTitle,
  ConfirmedUpload,
  GotFileDropMessage,
]);
export type MediaMessage = Schema.Schema.Type<typeof MediaMessage>;
