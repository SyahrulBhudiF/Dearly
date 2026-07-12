import { OwnerSession } from "@dearly/domain";
import { Effect, Option, Schema } from "effect";
import type { WorkerContext } from "../types";

interface OwnerSessionRow {
  readonly ownerId: string;
  readonly email: string;
  readonly displayName: string | null;
}

const toOwnerSession = (row: OwnerSessionRow) =>
  Schema.decodeUnknownOption(OwnerSession)({
    ownerId: row.ownerId,
    email: row.email,
    displayName: row.displayName ?? undefined,
  });

export const findOwnerSession = (
  context: WorkerContext,
): Effect.Effect<Option.Option<OwnerSession>> =>
  Option.match(context.sessionId, {
    onNone: () => Effect.succeed(Option.none()),
    onSome: (sessionId) => findOwnerSessionById(context, sessionId),
  });

const findOwnerSessionById = (
  context: WorkerContext,
  sessionId: string,
): Effect.Effect<Option.Option<OwnerSession>> => {
  const db = context.env.DB;
  if (db === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() =>
    db
      .prepare(
        `SELECT owners.id AS ownerId, owners.email, owners.display_name AS displayName
         FROM sessions
         INNER JOIN owners ON owners.id = sessions.owner_id
         WHERE sessions.id = ? AND sessions.expires_at > ?`,
      )
      .bind(sessionId, new Date().toISOString())
      .first<OwnerSessionRow>(),
  ).pipe(Effect.map((row) => (row === null ? Option.none() : toOwnerSession(row))));
};
