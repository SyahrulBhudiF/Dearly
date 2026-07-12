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

export const getEntryByDate = (date: string) =>
  client.pipe(Effect.flatMap((rpc) => rpc.getEntryByDate({ date: date as never })));

export const saveEntry = (date: string, text: string) =>
  client.pipe(
    Effect.flatMap((rpc) =>
      rpc.saveEntry({
        date: date as never,
        document: {
          version: 1,
          logicalWidth: 1000,
          logicalHeight: 1400,
          elements: [
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
              y: 120,
              width: 720,
              height: 240,
              rotation: 0,
              layer: 0,
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
