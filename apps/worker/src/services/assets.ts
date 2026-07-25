import { Context, Effect, Layer, Option } from "effect";

export interface AssetServiceShape {
  readonly fetch: (request: Request) => Effect.Effect<Option.Option<Response>>
}

export class AssetService extends Context.Service<AssetService, AssetServiceShape>()("AssetService") {}

const noop = AssetService.of({
  fetch: Effect.fn("AssetService.fetch")(function* () {
    return Option.none();
  }),
});

const make = (binding: Fetcher) =>
  AssetService.of({
    fetch: Effect.fn("AssetService.fetch")(function* (request: Request) {
      const response = yield* Effect.promise(() => binding.fetch(request));
      if (response.status === 404) return Option.none();
      return Option.some(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }),
      );
    }),
  });

export const AssetLive = (
  binding: Fetcher | undefined,
): Layer.Layer<AssetService> =>
  binding === undefined
    ? Layer.succeed(AssetService, noop)
    : Layer.succeed(AssetService, make(binding));
