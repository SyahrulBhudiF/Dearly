import { OwnerSession, OwnerSession as OwnerSessionSchema } from "@dearly/domain";
import { and, eq, gt } from "drizzle-orm";
import { Effect, Option, Schema } from "effect";
import { getDb } from "../database/client";
import { owners, sessions } from "../database/schema";
import type { WorkerEffect } from "../libs/http";
import type { WorkerContext } from "../types";

export const getSession = (context: WorkerContext): WorkerEffect<Option.Option<OwnerSession>> =>
  Option.match(context.sessionId, {
    onNone: () => Effect.succeed(Option.none()),
    onSome: (sessionId) => {
      const db = getDb(context);
      if (db === undefined) {
        return Effect.succeed(Option.none());
      }

      return Effect.promise(() =>
        db
          .select({
            ownerId: owners.id,
            email: owners.email,
            displayName: owners.displayName,
          })
          .from(sessions)
          .innerJoin(owners, eq(owners.id, sessions.ownerId))
          .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date().toISOString())))
          .limit(1),
      ).pipe(
        Effect.map((rows) =>
          rows.length === 0
            ? Option.none()
            : Schema.decodeUnknownOption(OwnerSessionSchema)({
                ownerId: rows[0]!.ownerId,
                email: rows[0]!.email,
                displayName: rows[0]!.displayName ?? undefined,
              }),
        ),
      );
    },
  });
