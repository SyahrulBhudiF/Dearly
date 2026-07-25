import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import * as rpc from "../rpc";
import { FailedToLoad, LoadedEntries, LoadedSession } from "./message";

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
