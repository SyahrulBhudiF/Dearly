import { BrowserHttpClient } from "@effect/platform-browser";
import { DearlyRpc } from "@dearly/rpc";
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

export const saveEntry = (
  date: string,
  text: string,
  imageMediaObjectId: string | null,
  stickerMediaObjectId: string | null,
  stickerId: string | null,
  imagePosition: { readonly x: number; readonly y: number },
  stickerPosition: { readonly x: number; readonly y: number },
) =>
  client.pipe(
    Effect.flatMap((rpc) =>
      rpc.saveEntry({
        date: date as never,
        document: {
          version: 1,
          logicalWidth: 1000,
          logicalHeight: 1400,
          elements: [
            ...(imageMediaObjectId === null
              ? []
              : [
                  {
                    id: crypto.randomUUID() as never,
                    payload: { kind: "image" as const, mediaObjectId: imageMediaObjectId as never },
                    x: imagePosition.x,
                    y: imagePosition.y,
                    width: 480,
                    height: 320,
                    rotation: 0,
                    layer: 0,
                  },
                ]),
            ...(stickerMediaObjectId === null
              ? []
              : [
                  {
                    id: crypto.randomUUID() as never,
                    payload: {
                      kind: "sticker" as const,
                      stickerId: stickerId as never,
                      mediaObjectId: stickerMediaObjectId as never,
                    },
                    x: stickerPosition.x,
                    y: stickerPosition.y,
                    width: 160,
                    height: 160,
                    rotation: 0,
                    layer: 1,
                  },
                ]),
            {
              id: crypto.randomUUID() as never,
              payload: {
                kind: "text",
                document: {
                  type: "doc",
                  content:
                    text === "" ? [] : [{ type: "paragraph", content: [{ type: "text", text }] }],
                },
              },
              x: 80,
              y: imageMediaObjectId === null ? 120 : 440,
              width: 720,
              height: 240,
              rotation: 0,
              layer: 2,
            },
          ],
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
