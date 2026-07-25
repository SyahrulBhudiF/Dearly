import { Effect } from "effect";
import { appErrorToResponse } from "./http";
import { route } from "./router";
import { makeAppLayer, RequestService } from "./services/appLayer";
import type { WorkerEnv } from "../alchemy.run";

export default {
  fetch: (request: Request, env: WorkerEnv) => {
    const appLayer = makeAppLayer(env);
    return Effect.runPromise(
      route(request).pipe(
        Effect.provideService(RequestService, request),
        Effect.provide(appLayer),
        Effect.matchEffect({
          onFailure: (error) => Effect.succeed(appErrorToResponse(error)),
          onSuccess: Effect.succeed,
        }),
      ),
    );
  },
};
