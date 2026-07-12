import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import {
  FailedToLoad,
  FailedToSave,
  LoadedDraft,
  StoredDraft,
  LoadedEntries,
  LoadedEntry,
  LoadedSession,
  SavedEntry,
} from "./message";
import * as draft from "./draft";
import * as rpc from "./rpc";

export const loadSession = Command.define(
  "loadSession",
  LoadedSession,
  FailedToLoad,
)(
  rpc.getSession.pipe(
    Effect.map((session) => LoadedSession({ session })),
    Effect.catch(() => Effect.succeed(FailedToLoad())),
  ),
);

export const loadEntries = Command.define(
  "loadEntries",
  { month: Schema.String },
  LoadedEntries,
  FailedToLoad,
)(({ month }) =>
  rpc.listMonthEntries(month).pipe(
    Effect.map((entries) => LoadedEntries({ entries })),
    Effect.catch(() => Effect.succeed(FailedToLoad())),
  ),
);

export const loadDraft = Command.define(
  "loadDraft",
  { date: Schema.String },
  LoadedDraft,
  FailedToLoad,
)(({ date }) => Effect.sync(() => LoadedDraft({ text: draft.readDraft(date) })));

export const storeDraft = Command.define(
  "storeDraft",
  { date: Schema.String, text: Schema.String },
  StoredDraft,
  FailedToSave,
)(({ date, text }) =>
  Effect.sync(() => writeOrRemoveDraft(date, text)).pipe(Effect.as(StoredDraft())),
);

export const removeDraft = Command.define(
  "removeDraft",
  { date: Schema.String },
  StoredDraft,
  FailedToSave,
)(({ date }) => Effect.sync(() => draft.removeDraft(date)).pipe(Effect.as(StoredDraft())));

export const loadEntry = Command.define(
  "loadEntry",
  { date: Schema.String },
  LoadedEntry,
  FailedToLoad,
)(({ date }) =>
  rpc.getEntryByDate(date).pipe(
    Effect.map((entry) => LoadedEntry({ entry })),
    Effect.catch(() => Effect.succeed(LoadedEntry({ entry: null }))),
  ),
);

const writeOrRemoveDraft = (date: string, text: string) =>
  text === "" ? draft.removeDraft(date) : draft.writeDraft(date, text);

export const saveEntry = Command.define(
  "saveEntry",
  { date: Schema.String, text: Schema.String },
  SavedEntry,
  FailedToSave,
)(({ date, text }) =>
  rpc.saveEntry(date, text).pipe(
    Effect.map((entry) => SavedEntry({ entry })),
    Effect.catch(() => Effect.succeed(FailedToSave())),
  ),
);
