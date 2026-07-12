import { Effect, Option } from "effect";
import type { WorkerContext } from "../../types";
import type { WorkerEffect } from "../../libs/http";

export const assets = (
  request: Request,
  context: WorkerContext,
): WorkerEffect<Option.Option<Response>> => {
  const assetsBinding = context.env.ASSETS;
  if (assetsBinding === undefined) {
    return Effect.succeed(Option.none());
  }

  return Effect.promise(() => assetsBinding.fetch(request)).pipe(
    Effect.map((response) => {
      if (response.status === 404) {
        return Option.none();
      }

      return Option.some(
        new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        }),
      );
    }),
  );
};
