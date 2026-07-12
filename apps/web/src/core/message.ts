import { Schema } from "effect";
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
export const ToggledStickerPicker = Message.m("ToggledStickerPicker");
export const LoadedStickers = Message.m("LoadedStickers", { stickers: Schema.Array(Sticker) });
export const SelectedSticker = Message.m("SelectedSticker", { sticker: Sticker });

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
  ToggledStickerPicker,
  LoadedStickers,
  SelectedSticker,
]);
export type AppMessage = Schema.Schema.Type<typeof AppMessage>;
