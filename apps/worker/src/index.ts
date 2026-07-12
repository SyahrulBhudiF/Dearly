import { Effect } from "effect";
import type { DearlyEnv } from "./types";
import { handleRequestEffect } from "./router";

export { handleRequestEffect };
export type { DearlyEnv };

export const handleRequest = (request: Request, env: DearlyEnv): Promise<Response> =>
  Effect.runPromise(handleRequestEffect(request, env));

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<DearlyEnv>;
