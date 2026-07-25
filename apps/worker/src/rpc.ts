import { EntryNotFound, MediaNotFound } from "@dearly/domain";
import { DearlyRpc } from "@dearly/rpc";
import { Effect, Layer, Option } from "effect";
import type { HttpServerResponse } from "effect/unstable/http/HttpServerResponse";
import * as HttpEffect from "effect/unstable/http/HttpEffect";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { EntryService } from "./services/entry";
import { MediaService } from "./services/media";
import { StickerService } from "./services/sticker";
import { getSession } from "./session";

export const rpc = Effect.fn("rpc")(function* (request: Request) {
    const ctx = yield* Effect.context();
    const rpcEffect = Effect.flatten(
      Effect.provide(
        RpcServer.toHttpEffect(DearlyRpc),
        Layer.mergeAll(RpcHandlerLayer, RpcSerialization.layerNdjson),
      ),
    ).pipe(Effect.provide(ctx));
    // The types don't narrow across flatten+provide; services are provided at runtime.
    const handler = HttpEffect.toWebHandler(
      rpcEffect as Effect.Effect<HttpServerResponse, never>,
    );
    return yield* Effect.promise(() => handler(request));
  });

const RpcHandlerLayer = DearlyRpc.toLayer({
  getSession: () =>
    getSession.pipe(
      Effect.map(
        Option.match({
          onNone: () => null,
          onSome: (session) => session,
        }),
      ),
    ),
  listMonthEntries: ({ month }) =>
    Effect.gen(function* () {
      const entry = yield* EntryService;
      return yield* entry.listMonthEntries(month);
    }),
  getEntryByDate: ({ date }) =>
    Effect.gen(function* () {
      const entry = yield* EntryService;
      const result = yield* entry.getEntryByDate(date);
      return yield* Option.match(result, {
        onNone: () =>
          Effect.fail(new EntryNotFound({ date, message: "Entry not found" })),
        onSome: Effect.succeed,
      });
    }),
  saveEntry: (payload) =>
    Effect.gen(function* () {
      const entry = yield* EntryService;
      return yield* entry.saveEntry(payload);
    }),
  discardServerEntry: ({ date }) =>
    Effect.gen(function* () {
      const entry = yield* EntryService;
      return yield* entry.discardServerEntry(date);
    }),
  createMediaUpload: (payload) =>
    Effect.gen(function* () {
      const media = yield* MediaService;
      return yield* media.createMediaUpload(payload);
    }),
  getMediaObject: ({ mediaObjectId }) =>
    Effect.gen(function* () {
      const media = yield* MediaService;
      const result = yield* media.getMediaObject(mediaObjectId);
      return yield* Option.match(result, {
        onNone: () =>
          Effect.fail(new MediaNotFound({ mediaObjectId, message: "Media not found" })),
        onSome: Effect.succeed,
      });
    }),
  listImages: () =>
    Effect.gen(function* () {
      const media = yield* MediaService;
      return yield* media.listImages();
    }),
  listStickers: () =>
    Effect.gen(function* () {
      const sticker = yield* StickerService;
      return yield* sticker.listStickers();
    }),
  createSticker: ({ mediaObjectId, label }) =>
    Effect.gen(function* () {
      const sticker = yield* StickerService;
      return yield* sticker.createSticker(mediaObjectId, label);
    }),
  deleteStickerFromPicker: ({ stickerId }) =>
    Effect.gen(function* () {
      const sticker = yield* StickerService;
      return yield* sticker.deleteStickerFromPicker(stickerId);
    }),
});
