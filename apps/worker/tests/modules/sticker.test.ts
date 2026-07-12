import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { createSticker, deleteStickerFromPicker, listStickers } from "../../src/modules/sticker";
import { context, mediaId, ownerId, stickerId } from "../fakes";

const owner = { ownerId, email: "owner@dearly.test", displayName: "Owner" } as never;

describe("sticker module", () => {
  it("lists stickers", async () => {
    const stickers = await Effect.runPromise(listStickers(context(), owner));

    expect(stickers).toMatchObject([
      { id: stickerId, ownerId, mediaObjectId: mediaId, label: "heart" },
    ]);
  });

  it("creates a sticker", async () => {
    const sticker = await Effect.runPromise(
      createSticker(context(), owner, mediaId as never, "wow"),
    );

    expect(sticker).toMatchObject({ ownerId, mediaObjectId: mediaId, label: "wow" });
  });

  it("deletes a sticker from picker", async () => {
    const ctx = context();

    await Effect.runPromise(deleteStickerFromPicker(ctx, owner, stickerId as never));
    const stickers = await Effect.runPromise(listStickers(ctx, owner));

    expect(stickers).toEqual([]);
  });
});
