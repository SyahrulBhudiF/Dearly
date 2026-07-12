import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { DearlyRpc } from "@dearly/rpc";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { handleRequest } from "../src/index";
import { fakeDb, ownerId } from "./fakes";

const workerClient = HttpClient.make((request) =>
  HttpClientRequest.toWeb(request).pipe(
    Effect.flatMap((webRequest) =>
      Effect.promise(() =>
        handleRequest(new Request(webRequest), {
          APP_ENV: "test",
          DEV_OWNER_ID: ownerId,
          DB: fakeDb(),
        }),
      ),
    ),
    Effect.map((response) => HttpClientResponse.fromWeb(request, response)),
  ),
);

describe("Effect RPC protocol", () => {
  it("calls the Worker through the shared RPC contract", async () => {
    const session = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* RpcClient.make(DearlyRpc);
        return yield* client.getSession();
      }).pipe(
        Effect.scoped,
        Effect.provide(
          RpcClient.layerProtocolHttp({ url: "https://dearly.test/rpc" }).pipe(
            Layer.provide(Layer.succeed(HttpClient.HttpClient, workerClient)),
            Layer.provide(RpcSerialization.layerNdjson),
          ),
        ),
      ),
    );

    expect(session).toMatchObject({ ownerId });
  });
});
