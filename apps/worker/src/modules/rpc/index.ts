import {
  CalendarDate,
  CalendarMonth,
  DiaryEntry,
  EntryPreview,
  type OwnerSession,
  OwnerSession as OwnerSessionSchema,
  SaveEntryPayload,
  Unauthorized,
} from "@dearly/domain";
import { and, between, eq, gt } from "drizzle-orm";
import { DateTime, Effect, Option, Schema } from "effect";
import { getDb } from "../../database/client";
import { diaryEntries, owners, sessions } from "../../database/schema";
import { json, notImplemented, type WorkerEffect } from "../../libs/http";
import type { WorkerContext } from "../../types";

export const rpc = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const procedure = new URL(request.url).pathname.slice("/rpc/".length);

  if (procedure === "getSession") {
    return findOwnerSession(context).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => json(200, null),
          onSome: (session) => json(200, session),
        }),
      ),
    );
  }

  if (procedure === "listMonthEntries") {
    return withOwner(context, (owner) =>
      readJson(request).pipe(
        Effect.flatMap((body) =>
          Option.match(Schema.decodeUnknownOption(Schema.Struct({ month: CalendarMonth }))(body), {
            onNone: badPayload,
            onSome: ({ month }) =>
              listMonthEntries(context, owner, month).pipe(
                Effect.flatMap((previews) => json(200, previews)),
              ),
          }),
        ),
      ),
    );
  }

  if (procedure === "getEntryByDate") {
    return withOwner(context, (owner) =>
      readJson(request).pipe(
        Effect.flatMap((body) =>
          Option.match(Schema.decodeUnknownOption(Schema.Struct({ date: CalendarDate }))(body), {
            onNone: badPayload,
            onSome: ({ date }) =>
              getEntryByDate(context, owner, date).pipe(
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      json(404, { error: "EntryNotFound", date, message: "Entry not found" }),
                    onSome: (entry) => json(200, entry),
                  }),
                ),
              ),
          }),
        ),
      ),
    );
  }

  if (procedure === "saveEntry") {
    return withOwner(context, (owner) =>
      readJson(request).pipe(
        Effect.flatMap((body) =>
          Option.match(Schema.decodeUnknownOption(SaveEntryPayload)(body), {
            onNone: badPayload,
            onSome: (payload) =>
              saveEntry(context, owner, payload).pipe(Effect.flatMap((entry) => json(200, entry))),
          }),
        ),
      ),
    );
  }

  return notImplemented(`RPC procedure is not wired yet: ${procedure}`);
};

const findOwnerSession = (context: WorkerContext): WorkerEffect<Option.Option<OwnerSession>> =>
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

const listMonthEntries = (
  context: WorkerContext,
  owner: OwnerSession,
  month: CalendarMonth,
): WorkerEffect<ReadonlyArray<Schema.Schema.Type<typeof EntryPreview>>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed([]);
  }

  return Effect.promise(() =>
    db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.ownerId, owner.ownerId),
          between(diaryEntries.entryDate, `${month}-01`, `${month}-31`),
        ),
      )
      .orderBy(diaryEntries.entryDate),
  ).pipe(Effect.map((rows) => rows.flatMap((row) => optionToArray(toPreview(row)))));
};

const getEntryByDate = (
  context: WorkerContext,
  owner: OwnerSession,
  date: CalendarDate,
): WorkerEffect<Option.Option<Schema.Schema.Type<typeof DiaryEntry>>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() =>
    db
      .select()
      .from(diaryEntries)
      .where(and(eq(diaryEntries.ownerId, owner.ownerId), eq(diaryEntries.entryDate, date)))
      .limit(1),
  ).pipe(Effect.map((rows) => (rows.length === 0 ? Option.none() : toEntry(rows[0]!))));
};

const saveEntry = (
  context: WorkerContext,
  owner: OwnerSession,
  payload: Schema.Schema.Type<typeof SaveEntryPayload>,
): WorkerEffect<Schema.Schema.Type<typeof DiaryEntry>> => {
  const db = getDb(context);
  if (db === undefined) {
    return Effect.die(new Error("D1 DB binding is required to save entries"));
  }

  const updatedAt = DateTime.formatIso(DateTime.nowUnsafe());

  return Effect.promise(() =>
    db
      .insert(diaryEntries)
      .values({
        id: crypto.randomUUID(),
        ownerId: owner.ownerId,
        entryDate: payload.date,
        documentJson: payload.document,
        previewSnippet: payload.preview.snippet ?? null,
        previewThumbnailMediaObjectId: payload.preview.thumbnailMediaObjectId ?? null,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: [diaryEntries.ownerId, diaryEntries.entryDate],
        set: {
          documentJson: payload.document,
          previewSnippet: payload.preview.snippet ?? null,
          previewThumbnailMediaObjectId: payload.preview.thumbnailMediaObjectId ?? null,
          updatedAt,
        },
      })
      .returning(),
  ).pipe(Effect.map((rows) => Option.getOrThrow(toEntry(rows[0]!))));
};

const toPreview = (row: typeof diaryEntries.$inferSelect) =>
  Schema.decodeUnknownOption(EntryPreview)({
    date: row.entryDate,
    snippet: row.previewSnippet ?? undefined,
    thumbnailMediaObjectId: row.previewThumbnailMediaObjectId ?? undefined,
    hasSavedEntry: true,
    hasDraft: false,
  });

const toEntry = (row: typeof diaryEntries.$inferSelect) =>
  Option.flatMap(toPreview(row), (preview) =>
    Schema.decodeUnknownOption(DiaryEntry)({
      id: row.id,
      ownerId: row.ownerId,
      date: row.entryDate,
      document: row.documentJson,
      preview,
      updatedAt: DateTime.makeUnsafe(row.updatedAt),
    }),
  );

const withOwner = (
  context: WorkerContext,
  use: (owner: OwnerSession) => WorkerEffect<Response>,
): WorkerEffect<Response> =>
  findOwnerSession(context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => json(401, new Unauthorized({ message: "Owner session is required" })),
        onSome: use,
      }),
    ),
  );

const readJson = (request: Request): WorkerEffect<unknown> => Effect.promise(() => request.json());

const optionToArray = <A>(option: Option.Option<A>): ReadonlyArray<A> =>
  Option.match(option, { onNone: () => [], onSome: (value) => [value] });

const badPayload = () => json(400, { error: "BadRequest", message: "Invalid RPC payload" });
