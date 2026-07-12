import { Effect, Option } from "effect";
import { loadConfig } from "./config/env";
import { assets } from "./assets";
import { health } from "./health";
import { notFound, type WorkerEffect } from "./libs/http";
import { media } from "./media";
import { rpc } from "./rpc";
import type { DearlyEnv, WorkerContext } from "./types";

export const handleRequestEffect = (request: Request, env: DearlyEnv): WorkerEffect<Response> =>
  loadConfig(env).pipe(
    Effect.orDie,
    Effect.flatMap((config) => route(request, { config, env, request })),
  );

const route = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return health(context);
  }

  if (url.pathname.startsWith("/rpc")) {
    return rpc(request, context);
  }

  if (url.pathname.startsWith("/media")) {
    return media(request, context);
  }

  return assets(request, context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: notFound,
        onSome: Effect.succeed,
      }),
    ),
  );
};
