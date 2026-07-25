import { BrowserHttpClient } from "@effect/platform-browser";
import { Effect, Layer } from "effect";
import * as HttpClient from "effect/unstable/http/HttpClient";

const make = Effect.gen(function* () {
  const defaultClient = yield* HttpClient.HttpClient;
  return defaultClient.pipe(
    HttpClient.filterStatusOk,
    HttpClient.retryTransient({ times: 3 }),
  );
});

const ConfiguredClient = Layer.effect(HttpClient.HttpClient, make);

export const HttpClientLive = ConfiguredClient.pipe(
  Layer.provide(BrowserHttpClient.layerFetch),
);
