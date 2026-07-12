import { BrowserHttpClient } from "@effect/platform-browser";
import { DearlyRpc } from "@dearly/rpc";
import type { CanvasElement } from "@dearly/domain";
import { Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";

const RpcClientLive = RpcClient.layerProtocolHttp({ url: "/rpc" }).pipe(
  Layer.provide(RpcSerialization.layerNdjson),
  Layer.provide(BrowserHttpClient.layerFetch),
);

const client = Effect.gen(function* () {
  return yield* RpcClient.make(DearlyRpc);
}).pipe(Effect.scoped, Effect.provide(RpcClientLive));

export const getSession = client.pipe(Effect.flatMap((rpc) => rpc.getSession()));

export const listMonthEntries = (month: string) =>
  client.pipe(Effect.flatMap((rpc) => rpc.listMonthEntries({ month: month as never })));

export const listStickers = client.pipe(Effect.flatMap((rpc) => rpc.listStickers()));

export const uploadImage = (file: File) =>
  client.pipe(
    Effect.flatMap((rpc) =>
      rpc.createMediaUpload({ kind: "image", mimeType: file.type, sizeBytes: file.size }),
    ),
    Effect.flatMap((upload) =>
      Effect.promise(() =>
        fetch(upload.uploadUrl, {
          method: "POST",
          headers: { "content-type": file.type },
          body: file,
        }),
      ).pipe(
        Effect.filterOrFail(
          (response) => response.ok,
          () => new Error("Image upload failed"),
        ),
        Effect.as(upload.mediaObjectId),
      ),
    ),
  );

export const getEntryByDate = (date: string) =>
  client.pipe(Effect.flatMap((rpc) => rpc.getEntryByDate({ date: date as never })));

export const saveEntry = (date: string, text: string, elements: ReadonlyArray<CanvasElement>) =>
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
          hasSavedEntry: true,
          hasDraft: false,
        },
      }),
    ),
  );
