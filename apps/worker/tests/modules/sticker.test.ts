import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { StickerService } from "../../src/services/sticker";
import { mediaId, ownerId, setTestTime, stickerId, testLayer } from "../fakes";

describe("sticker module", () => {
  it.effect("lists stickers", () =>
    Effect.gen(function*() {
      const sticker = yield* StickerService;
      const stickers = yield* sticker.listStickers();

      expect(stickers).toMatchObject([
        { id: stickerId, ownerId, mediaObjectId: mediaId, label: "heart" },
      ]);
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("creates a sticker", () =>
    Effect.gen(function*() {
      yield* setTestTime;
      const sticker = yield* StickerService;
      const result = yield* sticker.createSticker(mediaId as never, "wow");

      expect(result).toMatchObject({ ownerId, mediaObjectId: mediaId, label: "wow" });
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("deletes a sticker from picker", () =>
    Effect.gen(function*() {
      const sticker = yield* StickerService;
      yield* sticker.deleteStickerFromPicker(stickerId as never);
      const stickers = yield* sticker.listStickers();

      expect(stickers).toEqual([]);
    }).pipe(Effect.provide(testLayer())),
  );
});
