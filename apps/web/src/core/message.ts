import { Schema } from "effect";
import { FileDrop, Popover } from "@foldkit/ui";
import { DiaryEntry, EntryPreview, MediaObjectId, OwnerSession, Sticker } from "@dearly/domain";
import { File } from "foldkit/file";
import { Message } from "foldkit";
import { AppRoute } from "./route";

export const ChangedRoute = Message.m("ChangedRoute", { route: AppRoute });
export const SelectedDate = Message.m("SelectedDate", { date: Schema.String });
export const ChangedMonth = Message.m("ChangedMonth", { month: Schema.String });
export const LoadedSession = Message.m("LoadedSession", { session: Schema.NullOr(OwnerSession) });
export const LoadedEntries = Message.m("LoadedEntries", { entries: Schema.Array(EntryPreview) });
export const LoadedEntry = Message.m("LoadedEntry", { entry: Schema.NullOr(DiaryEntry) });
export const FailedToLoad = Message.m("FailedToLoad");
export const ChangedText = Message.m("ChangedText", { text: Schema.String });
export const SaveRequested = Message.m("SaveRequested");
export const SavedEntry = Message.m("SavedEntry", { entry: DiaryEntry });
export const FailedToSave = Message.m("FailedToSave");
export const DiscardedDraft = Message.m("DiscardedDraft");
export const LoadedDraft = Message.m("LoadedDraft", { text: Schema.NullOr(Schema.String) });
export const StoredDraft = Message.m("StoredDraft");
export const SelectedImage = Message.m("SelectedImage", { file: File });
export const UploadedImage = Message.m("UploadedImage", { mediaObjectId: MediaObjectId });
export const FailedToUploadImage = Message.m("FailedToUploadImage");
export const GotStickerPopoverMessage = Message.m("GotStickerPopoverMessage", {
  message: Popover.Message,
});
export const LoadedStickers = Message.m("LoadedStickers", { stickers: Schema.Array(Sticker) });
export const SelectedSticker = Message.m("SelectedSticker", { sticker: Sticker });
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
  ChangedMonth,
  LoadedSession,
  LoadedEntries,
  LoadedEntry,
  FailedToLoad,
  ChangedText,
  SaveRequested,
  SavedEntry,
  FailedToSave,
  DiscardedDraft,
  LoadedDraft,
  StoredDraft,
  SelectedImage,
  UploadedImage,
  FailedToUploadImage,
  GotStickerPopoverMessage,
  LoadedStickers,
  SelectedSticker,
  MovedCanvasElement,
  StartedResize,
  ResizedCanvasElement,
  FinishedResize,
  GotFileDropMessage,
]);
export type AppMessage = Schema.Schema.Type<typeof AppMessage>;
