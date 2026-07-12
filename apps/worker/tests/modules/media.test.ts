import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  createMediaUpload,
  getMediaObject,
  getPrivateMedia,
  uploadPrivateMedia,
} from "../../src/modules/media";
import { context, mediaId, ownerId } from "../fakes";

const owner = { ownerId, email: "owner@dearly.test", displayName: "Owner" } as never;

describe("media module", () => {
  it("creates upload metadata", async () => {
    const upload = await Effect.runPromise(
      createMediaUpload(context(), owner, { kind: "image", mimeType: "image/png", sizeBytes: 4 }),
    );

    expect(upload.r2Key.startsWith(`${ownerId}/`)).toBe(true);
    expect(upload.uploadUrl.startsWith("/media/")).toBe(true);
  });

  it("gets owner-scoped media metadata", async () => {
    const media = await Effect.runPromise(getMediaObject(context(), owner, mediaId as never));

    expect(Option.getOrThrow(media)).toMatchObject({ id: mediaId, ownerId, mimeType: "image/png" });
  });

  it("returns none for missing media metadata", async () => {
    const media = await Effect.runPromise(
      getMediaObject(context({ media: null }), owner, mediaId as never),
    );

    expect(Option.isNone(media)).toBe(true);
  });

  it("uploads and reads private media", async () => {
    const body = new Response("png").body!;
    const uploaded = await Effect.runPromise(
      uploadPrivateMedia(context(), owner, mediaId as never, body),
    );
    const read = await Effect.runPromise(getPrivateMedia(context(), owner, mediaId as never));

    expect(Option.isSome(uploaded)).toBe(true);
    expect(Option.getOrThrow(read).mimeType).toBe("image/png");
  });
});
