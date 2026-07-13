import { Effect, Schema } from "effect";
import { CanvasElement } from "@dearly/domain";
import { Command } from "foldkit";
import * as rpc from "../rpc";
import * as draft from "./draft";
import {
  FailedToLoad,
  FailedToSave,
  LoadedDraft,
  LoadedEntry,
  SavedEntry,
  StoredDraft,
} from "./message";

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
  Effect.sync(() => (text === "" ? draft.removeDraft(date) : draft.writeDraft(date, text))).pipe(
    Effect.as(StoredDraft()),
  ),
);

export const removeDraft = Command.define(
  "removeDraft",
  { date: Schema.String },
  StoredDraft,
  FailedToSave,
)(({ date }) => Effect.sync(() => draft.removeDraft(date)).pipe(Effect.as(StoredDraft())));

export const saveEntry = Command.define(
  "saveEntry",
  { date: Schema.String, text: Schema.String, elements: Schema.Array(CanvasElement) },
  SavedEntry,
  FailedToSave,
)(({ date, text, elements }) =>
  rpc.saveEntry(date, text, elements).pipe(
    Effect.map((entry) => SavedEntry({ entry })),
    Effect.catch(() => Effect.succeed(FailedToSave())),
  ),
);
