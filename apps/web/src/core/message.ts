import { Schema } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import {
  DiaryEntry,
  EntryPreview,
  MediaObject,
  MediaObjectId,
  OwnerSession,
  Sticker,
} from "@dearly/domain";
import { File } from "foldkit/file";
import { Message } from "foldkit";
import { AppRoute } from "./route";

export const ChangedRoute = Message.m("ChangedRoute", { route: AppRoute });
export const SelectedDate = Message.m("SelectedDate", { date: Schema.String });
export const PreviewedDate = Message.m("PreviewedDate", { date: Schema.String });
export const ToggledPicker = Message.m("ToggledPicker");
export const PickedYear = Message.m("PickedYear", { year: Schema.Number });
export const ChangedMonth = Message.m("ChangedMonth", { month: Schema.String });
export const WentToday = Message.m("WentToday");
export const LoadedSession = Message.m("LoadedSession", { session: Schema.NullOr(OwnerSession) });
export const LoadedEntries = Message.m("LoadedEntries", { entries: Schema.Array(EntryPreview) });
export const LoadedEntry = Message.m("LoadedEntry", { entry: Schema.NullOr(DiaryEntry) });
export const FailedToLoad = Message.m("FailedToLoad");
export const ChangedText = Message.m("ChangedText", {
  id: Schema.String,
  text: Schema.String,
});
export const ChangedImageTitle = Message.m("ChangedImageTitle", {
  id: Schema.String,
  title: Schema.String,
});
export const SaveRequested = Message.m("SaveRequested");
export const SavedEntry = Message.m("SavedEntry", { entry: DiaryEntry });
export const FailedToSave = Message.m("FailedToSave");
export const DiscardedDraft = Message.m("DiscardedDraft");
export const LoadedDraft = Message.m("LoadedDraft", { text: Schema.NullOr(Schema.String) });
export const StoredDraft = Message.m("StoredDraft");
export const AddedTextCanvasElement = Message.m("AddedTextCanvasElement");
export const SelectedImage = Message.m("SelectedImage", { file: File });
export const UploadedImage = Message.m("UploadedImage", { mediaObjectId: MediaObjectId });
export const FailedToUploadImage = Message.m("FailedToUploadImage");
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
export const SelectedCanvasElement = Message.m("SelectedCanvasElement", { id: Schema.String });
export const DeselectedCanvasElement = Message.m("DeselectedCanvasElement");
export const TransformedCanvasElement = Message.m("TransformedCanvasElement", {
  id: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
  rotation: Schema.Number,
});
export const DeleteCanvasElementRequested = Message.m("DeleteCanvasElementRequested");
export const DeletedCanvasElement = Message.m("DeletedCanvasElement");
export const RotatedCanvasElement = Message.m("RotatedCanvasElement", { degrees: Schema.Number });
export const ChangedCanvasElementLayer = Message.m("ChangedCanvasElementLayer", {
  direction: Schema.Literals(["forward", "backward"]),
});
export const GotDeleteDialogMessage = Message.m("GotDeleteDialogMessage", {
  message: Dialog.Message,
});
export const MovedCanvasElement = Message.m("MovedCanvasElement", {
  id: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
});
export const StartedResize = Message.m("StartedResize", {
  id: Schema.String,
  screenX: Schema.Number,
  screenY: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
});
export const ResizedCanvasElement = Message.m("ResizedCanvasElement", {
  screenX: Schema.Number,
  screenY: Schema.Number,
});
export const FinishedResize = Message.m("FinishedResize");
export const GotFileDropMessage = Message.m("GotFileDropMessage", { message: FileDrop.Message });

export const AppMessage = Schema.Union([
  ChangedRoute,
  SelectedDate,
  PreviewedDate,
  ToggledPicker,
  PickedYear,
  ChangedMonth,
  WentToday,
  LoadedSession,
  LoadedEntries,
  LoadedEntry,
  FailedToLoad,
  ChangedText,
  ChangedImageTitle,
  SaveRequested,
  SavedEntry,
  FailedToSave,
  DiscardedDraft,
  LoadedDraft,
  StoredDraft,
  AddedTextCanvasElement,
  SelectedImage,
  UploadedImage,
  FailedToUploadImage,
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
  SelectedCanvasElement,
  DeselectedCanvasElement,
  TransformedCanvasElement,
  DeleteCanvasElementRequested,
  DeletedCanvasElement,
  RotatedCanvasElement,
  ChangedCanvasElementLayer,
  GotDeleteDialogMessage,
  MovedCanvasElement,
  StartedResize,
  ResizedCanvasElement,
  FinishedResize,
  GotFileDropMessage,
]);
export type AppMessage = Schema.Schema.Type<typeof AppMessage>;
