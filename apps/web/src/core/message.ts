import { Schema } from "effect";
import { DiaryEntry, EntryPreview, OwnerSession } from "@dearly/domain";
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
]);
export type AppMessage = Schema.Schema.Type<typeof AppMessage>;
