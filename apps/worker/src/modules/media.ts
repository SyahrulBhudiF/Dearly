import { type MediaObjectId, type OwnerSession } from "@dearly/domain";
import { and, eq } from "drizzle-orm";
import { Effect, Option } from "effect";
import { getDb } from "../database/client";
import { mediaObjects } from "../database/schema";
import type { WorkerEffect } from "../libs/http";
import type { R2ObjectBody, WorkerContext } from "../types";

export interface PrivateMedia {
  readonly body: R2ObjectBody;
  readonly mimeType: string;
}

export const getPrivateMedia = (
  context: WorkerContext,
  owner: OwnerSession,
  id: MediaObjectId,
): WorkerEffect<Option.Option<PrivateMedia>> => {
  const db = getDb(context);
  const bucket = context.env.MEDIA;
  if (db === undefined || bucket === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() =>
    db
      .select()
      .from(mediaObjects)
      .where(and(eq(mediaObjects.id, id), eq(mediaObjects.ownerId, owner.ownerId)))
      .limit(1),
  ).pipe(
    Effect.flatMap((rows) => {
      const media = rows[0];
      if (media === undefined) {
        return Effect.succeed(Option.none());
      }

      return Effect.promise(() => bucket.get(media.r2Key)).pipe(
        Effect.map((body) =>
          body === null ? Option.none() : Option.some({ body, mimeType: media.mimeType }),
        ),
      );
    }),
  );
};
