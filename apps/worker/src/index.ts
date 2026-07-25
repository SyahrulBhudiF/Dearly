import { Effect, Layer } from "effect";
import { appErrorToResponse } from "./http";
import { LoggingLive } from "./libs/logging";
import { route } from "./router";
import { makeAppLayer, RequestService } from "./services/appLayer";
import type { WorkerEnv } from "../alchemy.run";

// Accept loose env for test compatibility; Cloudflare always provides the full WorkerEnv.
export const handleRequest = (request: Request, env: WorkerEnv): Promise<Response> =>
  Effect.runPromise(
    handleRequestEffect.pipe(
      Effect.provideService(RequestService, request),
      Effect.provide(makeAppLayer(env).pipe(Layer.provideMerge(LoggingLive))),
    ),
  );

const handleRequestEffect = Effect.gen(function* () {
  const request = yield* RequestService;
  const url = new URL(request.url);

  return yield* route(request).pipe(
    Effect.withLogSpan("request"),
    Effect.annotateLogs({
      method: request.method,
      path: url.pathname,
      cfRay: request.headers.get("cf-ray") ?? undefined,
    }),
    Effect.tapError((error) =>
      Effect.annotateLogs(Effect.logError(`${error._tag}: ${error.message}`), {
        error: { ...error },
      }),
    ),
    Effect.catchDefect((defect) =>
      Effect.annotateLogs(Effect.logError("Unhandled defect"), { defect: String(defect) }).pipe(
        Effect.andThen(() =>
          Effect.succeed(new Response("Internal Server Error", { status: 500 })),
        ),
      ),
    ),
    Effect.matchEffect({
      onFailure: (error) => Effect.succeed(appErrorToResponse(error)),
      onSuccess: Effect.succeed,
    }),
  );
});

export default {
  fetch: handleRequest,
};
