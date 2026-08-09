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

const isNavigation = (request: Request) =>
  request.method === "GET" && (request.headers.get("accept") ?? "").includes("text/html");

const make = (binding: Fetcher) => {
  const client = makeClient(binding).pipe(HttpClient.retryTransient({ times: 3 }));

  const fetchAsset = (request: Request) =>
    client.execute(HttpClientRequest.fromWeb(request)).pipe(
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
      Effect.catchTag("HttpClientError", () => Effect.succeed(Option.none<Response>())),
    );

  return Effect.succeed(
    AssetService.of({
      fetch: Effect.fn("AssetService.fetch")(function* (request: Request) {
        const served = yield* fetchAsset(request);
        if (Option.isSome(served) && served.value.status !== 404) return served;
        // SPA fallback: a browser navigation to a client-side route
        // (e.g. /entry/2026-08-09) has no static file — serve the app shell.
        if (!isNavigation(request)) return served;
        return yield* fetchAsset(new Request(new URL("/index.html", request.url)));
      }),
    }),
  );
};

export const AssetLive = (binding: Fetcher) => Layer.effect(AssetService, make(binding));
