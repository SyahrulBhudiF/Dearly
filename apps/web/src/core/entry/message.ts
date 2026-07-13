import { Schema } from "effect";
import { DiaryEntry } from "@dearly/domain";
import { Message } from "foldkit";

export const LoadedEntry = Message.m("LoadedEntry", { entry: Schema.NullOr(DiaryEntry) });
export const LoadedDraft = Message.m("LoadedDraft", { text: Schema.NullOr(Schema.String) });
export const StoredDraft = Message.m("StoredDraft");
export const TextChanged = Message.m("EntryTextChanged", { text: Schema.String });
export const SaveRequested = Message.m("SaveRequested");
export const SavedEntry = Message.m("SavedEntry", { entry: DiaryEntry });
export const FailedToSave = Message.m("FailedToSave");
export const FailedToLoad = Message.m("EntryFailedToLoad");
export const DiscardedDraft = Message.m("DiscardedDraft");

export const EntryMessage = Schema.Union([
  LoadedEntry,
  LoadedDraft,
  StoredDraft,
  TextChanged,
  SaveRequested,
  SavedEntry,
  FailedToSave,
  FailedToLoad,
  DiscardedDraft,
]);
export type EntryMessage = Schema.Schema.Type<typeof EntryMessage>;
