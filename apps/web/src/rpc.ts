import { DearlyRpc } from "@dearly/rpc";
import type { CanvasElement } from "@dearly/domain";
import { UploadFailed } from "@dearly/domain";
import { Effect, Layer } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpBody from "effect/unstable/http/HttpBody";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { HttpClientLive } from "./http";

const RpcClientLive = RpcClient.layerProtocolHttp({ url: "/rpc" }).pipe(
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(HttpClientLive),
);

const client = Effect.gen(function* () {
  return yield* RpcClient.make(DearlyRpc);
}).pipe(Effect.provide(RpcClientLive));

export const getSession = client.pipe(
  Effect.flatMap((rpc) => rpc.getSession()),
  Effect.scoped,
);

export const listMonthEntries = (month: string) =>
  client.pipe(
    Effect.flatMap((rpc) => rpc.listMonthEntries({ month: month as never })),
    Effect.scoped,
  );

export const listStickers = client.pipe(
  Effect.flatMap((rpc) => rpc.listStickers()),
  Effect.scoped,
);

export const listImages = client.pipe(
  Effect.flatMap((rpc) => rpc.listImages()),
  Effect.scoped,
);

const uploadMedia = (file: File, kind: "image" | "thumbnail") =>
  Effect.gen(function* () {
    const rpc = yield* RpcClient.make(DearlyRpc);
    const httpClient = yield* HttpClient.HttpClient;

    const upload = yield* rpc.createMediaUpload({
      kind,
      name: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    yield* httpClient.post(upload.uploadUrl, {
      headers: { "content-type": file.type },
      body: HttpBody.raw(file),
    });

    return upload.mediaObjectId;
  }).pipe(
    Effect.scoped,
    Effect.provide(RpcClientLive),
    Effect.provide(HttpClientLive),
    Effect.catchTag("HttpClientError", (error) =>
      Effect.logError(`[uploadMedia] HTTP upload failed`, error).pipe(
        Effect.flatMap(() => Effect.fail(new UploadFailed({ message: `Upload failed: ${error.message}` }))),
      ),
    ),
  );

export const uploadImage = (file: File) => uploadMedia(file, "image");
export const uploadThumbnail = (file: File) => uploadMedia(file, "thumbnail");

export const createSticker = (mediaObjectId: string, label: string) =>
  client.pipe(
    Effect.flatMap((rpc) => rpc.createSticker({ mediaObjectId: mediaObjectId as never, label })),
    Effect.scoped,
  );

export const getEntryByDate = (date: string) =>
  client.pipe(
    Effect.flatMap((rpc) => rpc.getEntryByDate({ date: date as never })),
    Effect.scoped,
  );

export const saveEntry = (
  date: string,
  text: string,
  elements: ReadonlyArray<CanvasElement>,
  thumbnailMediaObjectId: string,
) =>
  client.pipe(
    Effect.flatMap((rpc) =>
      rpc.saveEntry({
        date: date as never,
        document: {
          version: 1,
          logicalWidth: 1000,
          logicalHeight: 1400,
          elements,
        },
        preview: {
          date: date as never,
          snippet: text.trim().slice(0, 180) || undefined,
          thumbnailMediaObjectId: thumbnailMediaObjectId as never,
          hasSavedEntry: true,
          hasDraft: false,
        },
      }),
    ),
    Effect.scoped,
  );
