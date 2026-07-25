import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { MediaService } from "../../src/services/media";
import { mediaId, ownerId, setTestTime, testLayer } from "../fakes";

describe("media module", () => {
  it.effect("creates upload metadata", () =>
    Effect.gen(function*() {
      yield* setTestTime;
      const media = yield* MediaService;
      const upload = yield* media.createMediaUpload({
        kind: "image",
        name: "image.png",
        mimeType: "image/png",
        sizeBytes: 4,
      });

      expect(upload.r2Key.startsWith(`${ownerId}/`)).toBe(true);
      expect(upload.uploadUrl.startsWith("/media/")).toBe(true);
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("gets owner-scoped media metadata", () =>
    Effect.gen(function*() {
      const media = yield* MediaService;
      const result = yield* media.getMediaObject(mediaId as never);
      expect(Option.getOrThrow(result)).toMatchObject({
        id: mediaId,
        ownerId,
        mimeType: "image/png",
      });
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("returns none for missing media metadata", () =>
    Effect.gen(function*() {
      const media = yield* MediaService;
      const result = yield* media.getMediaObject(mediaId as never);
      expect(Option.isNone(result)).toBe(true);
    }).pipe(Effect.provide(testLayer({ media: null }))),
  );

  it.effect("uploads and reads private media", () =>
    Effect.gen(function*() {
      const media = yield* MediaService;
      const body = new Response("png").body!;
      const uploaded = yield* media.uploadPrivateMedia(mediaId as never, body);
      const read = yield* media.getPrivateMedia(mediaId as never);

      expect(Option.isSome(uploaded)).toBe(true);
      expect(Option.getOrThrow(read).mimeType).toBe("image/png");
    }).pipe(Effect.provide(testLayer())),
  );
});
