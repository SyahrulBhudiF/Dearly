import { Effect } from "effect";
import { appErrorToResponse } from "./libs/http";
import { handleRequestEffect } from "./router";
import type { DearlyEnv } from "./types";

export { handleRequestEffect };

export const handleRequest = (request: Request, env: DearlyEnv): Promise<Response> =>
  Effect.runPromise(
    handleRequestEffect(request, env).pipe(
      Effect.matchEffect({
        onFailure: (error) => Effect.succeed(appErrorToResponse(error)),
        onSuccess: Effect.succeed,
      }),
    ),
  );

export default {
  fetch: (request: Request, env: unknown) => handleRequest(request, env as DearlyEnv),
};
