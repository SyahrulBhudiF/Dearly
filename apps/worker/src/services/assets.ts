import { Context, Effect, Layer, Option } from "effect";
import * as Stream from "effect/Stream";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientError from "effect/unstable/http/HttpClientError";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

export interface AssetServiceShape {
  readonly fetch: (request: Request) => Effect.Effect<Option.Option<Response>>;
}

export class AssetService extends Context.Service<AssetService, AssetServiceShape>()(
  "AssetService",
) {}

const makeClient = (binding: Fetcher): HttpClient.HttpClient =>
  HttpClient.make((request, url, signal) =>
    Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          binding.fetch(url, {
            method: request.method,
            headers: request.headers,
            signal,
          }),
        catch: (cause) =>
          new HttpClientError.HttpClientError({
            reason: new HttpClientError.TransportError({ request, cause }),
          }),
      });
      return HttpClientResponse.fromWeb(request, response);
    }),
  );

const make = (binding: Fetcher) => {
  const client = makeClient(binding).pipe(
    HttpClient.filterStatusOk,
    HttpClient.retryTransient({ times: 3 }),
  );

  return Effect.succeed(
    AssetService.of({
      fetch: Effect.fn("AssetService.fetch")(function* (request: Request) {
        const httpRequest = HttpClientRequest.fromWeb(request);
        return yield* client.execute(httpRequest).pipe(
          Effect.flatMap((res) =>
            Effect.gen(function* () {
              const body = yield* Stream.toReadableStreamEffect(res.stream);
              return Option.some(
                new Response(body, {
                  status: res.status,
                  headers: res.headers,
                }),
              );
            }),
          ),
          Effect.catchTag("HttpClientError", (error) =>
            Effect.logError("[AssetService.fetch] Failed", error).pipe(
              Effect.as(Option.none<Response>()),
            ),
          ),
        );
      }),
    }),
  );
};

export const AssetLive = (binding: Fetcher) => Layer.effect(AssetService, make(binding));
