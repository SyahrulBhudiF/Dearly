import { Context, Effect, Layer, Option } from "effect";

export interface PrivateMedia {
  readonly body: R2ObjectBody;
  readonly mimeType: string;
}

export interface MediaStorageServiceShape {
  readonly put: (key: string, body: ReadableStream | null) => Effect.Effect<void>
  readonly get: (key: string) => Effect.Effect<Option.Option<R2ObjectBody>>
}

export class MediaStorageService extends Context.Service<MediaStorageService, MediaStorageServiceShape>()(
  "MediaStorageService",
) {}

const noop = MediaStorageService.of({
  put: Effect.fn("MediaStorageService.put")(function* () {}),
  get: Effect.fn("MediaStorageService.get")(function* () {
    return Option.none();
  }),
});

const make = (bucket: R2Bucket) =>
  MediaStorageService.of({
    put: Effect.fn("MediaStorageService.put")(function* (
      key: string,
      body: ReadableStream | null,
    ) {
      if (body === null) return;
      yield* Effect.promise(() => bucket.put(key, body));
    }),
    get: Effect.fn("MediaStorageService.get")(function* (key: string) {
      const body = yield* Effect.promise(() => bucket.get(key));
      return body === null ? Option.none() : Option.some(body);
    }),
  });

export const MediaStorageLive = (
  binding: R2Bucket | undefined,
): Layer.Layer<MediaStorageService> =>
  binding === undefined
    ? Layer.succeed(MediaStorageService, noop)
    : Layer.succeed(MediaStorageService, make(binding));
