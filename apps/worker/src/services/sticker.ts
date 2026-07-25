import type { DatabaseError, MediaObjectId, Sticker, StickerId, Unauthorized } from "@dearly/domain";
import { Context, Effect, Layer } from "effect";
import { requireOwner } from "../session";
import { DatabaseService } from "./database";
import type { ConfigService } from "./config";
import type { RequestService } from "./appLayer";

export interface StickerServiceShape {
  readonly listStickers: () => Effect.Effect<
    ReadonlyArray<Sticker>,
    Unauthorized | DatabaseError,
    ConfigService | RequestService
  >;
  readonly createSticker: (
    mediaObjectId: MediaObjectId,
    label: string,
  ) => Effect.Effect<Sticker, Unauthorized | DatabaseError, ConfigService | RequestService>;
  readonly deleteStickerFromPicker: (
    stickerId: StickerId,
  ) => Effect.Effect<void, Unauthorized | DatabaseError, ConfigService | RequestService>;
}

export class StickerService extends Context.Service<StickerService, StickerServiceShape>()(
  "StickerService",
) {}

export const StickerLive = Layer.effect(
  StickerService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    return StickerService.of({
      listStickers: Effect.fn("StickerService.listStickers")(function* () {
        const owner = yield* requireOwner;
        return yield* db.listStickersByOwner(owner);
      }),
      createSticker: Effect.fn("StickerService.createSticker")(function* (
        mediaObjectId: MediaObjectId,
        label: string,
      ) {
        const owner = yield* requireOwner;
        return yield* db.insertSticker(owner, mediaObjectId, label);
      }),
      deleteStickerFromPicker: Effect.fn("StickerService.deleteStickerFromPicker")(function* (
        stickerId: StickerId,
      ) {
        const owner = yield* requireOwner;
        return yield* db.deleteSticker(owner, stickerId);
      }),
    });
  }),
);
