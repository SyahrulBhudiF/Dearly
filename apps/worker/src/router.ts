import { Effect, Option } from "effect";
import { loadConfig } from "./config";
import type { DearlyEnv } from "./env";
import { notFound, type WorkerEffect } from "./http";
import { assets } from "./routes/assets";
import { health } from "./routes/health";
import { media } from "./routes/media";
import { rpc } from "./routes/rpc";

export const handleRequestEffect = (request: Request, env: DearlyEnv): WorkerEffect<Response> =>
  loadConfig(env).pipe(
    Effect.orDie,
    Effect.flatMap((config) => route(request, { config, env })),
  );

const route = (request: Request, context: Parameters<typeof health>[0]): WorkerEffect<Response> => {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return health(context);
  }

  if (url.pathname.startsWith("/rpc")) {
    return rpc(context);
  }

  if (url.pathname.startsWith("/media")) {
    return media(context);
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
