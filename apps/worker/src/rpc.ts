import { EntryNotFound, MediaNotFound, type OwnerSession, Unauthorized } from "@dearly/domain";
import { DearlyRpc } from "@dearly/rpc";
import { Effect, Layer, Option } from "effect";
import * as HttpEffect from "effect/unstable/http/HttpEffect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { discardServerEntry, getEntryByDate, listMonthEntries, saveEntry } from "./modules/entry";
import { createMediaUpload, getMediaObject, listImages } from "./modules/media";
import { getSession } from "./modules/session";
import { createSticker, deleteStickerFromPicker, listStickers } from "./modules/sticker";
import type { WorkerEffect } from "./libs/http";
import type { WorkerContext } from "./types";

export const rpc = (request: Request, context: WorkerContext) =>
  Effect.promise(() => HttpEffect.toWebHandler(server(context))(request)).pipe(Effect.orDie);

const server = (context: WorkerContext) =>
  Effect.flatten(
    Effect.provide(
      RpcServer.toHttpEffect(DearlyRpc),
      Layer.mergeAll(handlers(context), RpcSerialization.layerNdjson),
    ),
  );

const handlers = (context: WorkerContext) =>
  DearlyRpc.toLayer({
    getSession: (_payload) =>
      getSession(context).pipe(
        Effect.map(
          Option.match({
            onNone: () => null,
            onSome: (session) => session,
          }),
        ),
      ),
    listMonthEntries: ({ month }) =>
      withOwner(context, (owner) => listMonthEntries(context, owner, month)),
    getEntryByDate: ({ date }) =>
      withOwner(context, (owner) =>
        getEntryByDate(context, owner, date).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new EntryNotFound({ date, message: "Entry not found" })),
              onSome: Effect.succeed,
            }),
          ),
        ),
      ),
    saveEntry: (payload) => withOwner(context, (owner) => saveEntry(context, owner, payload)),
    discardServerEntry: ({ date }) =>
      withOwner(context, (owner) => discardServerEntry(context, owner, date)),
    createMediaUpload: (payload) =>
      withOwner(context, (owner) => createMediaUpload(context, owner, payload)),
    getMediaObject: ({ mediaObjectId }) =>
      withOwner(context, (owner) =>
        getMediaObject(context, owner, mediaObjectId).pipe(
          Effect.flatMap(
            Option.match({
              onNone: () =>
                Effect.fail(new MediaNotFound({ mediaObjectId, message: "Media not found" })),
              onSome: Effect.succeed,
            }),
          ),
        ),
      ),
    listImages: () => withOwner(context, (owner) => listImages(context, owner)),
    listStickers: () => withOwner(context, (owner) => listStickers(context, owner)),
    createSticker: ({ mediaObjectId, label }) =>
      withOwner(context, (owner) => createSticker(context, owner, mediaObjectId, label)),
    deleteStickerFromPicker: ({ stickerId }) =>
      withOwner(context, (owner) => deleteStickerFromPicker(context, owner, stickerId)),
  });

const withOwner = <A>(
  context: WorkerContext,
  use: (owner: OwnerSession) => WorkerEffect<A>,
): WorkerEffect<A> =>
  getSession(context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.fail(new Unauthorized({ message: "Owner session is required" })),
        onSome: use,
      }),
    ),
  );
