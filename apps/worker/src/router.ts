import { Effect, Match, Option } from "effect";
import { assets } from "./assets";
import { health } from "./health";
import { notFound } from "./http";
import { rpc } from "./rpc";
import { MediaService } from "./services/media";

export const route = Effect.fn("route")(function* (request: Request) {
  const url = new URL(request.url);

  return yield* Match.value(url).pipe(
    Match.when({ pathname: "/health" }, () => health),
    Match.when(
      (url) => url.pathname.startsWith("/rpc"),
      () => rpc(request),
    ),
    Match.when(
      (url) => url.pathname.startsWith("/media"),
      () =>
        Effect.gen(function* () {
          const media = yield* MediaService;
          return yield* media.serveMedia(request);
        }),
    ),
    Match.orElse(() =>
      Effect.gen(function* () {
        const asset = yield* assets(request);
        return yield* Option.match(asset, {
          onNone: notFound,
          onSome: Effect.succeed,
        });
      }),
    ),
  );
});
