import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import {
  FailedToLoad,
  FailedToSave,
  LoadedEntries,
  LoadedEntry,
  LoadedSession,
  SavedEntry,
} from "./message";
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
