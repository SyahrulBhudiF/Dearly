import { Effect, Option } from "effect";
import { json, notImplemented, type WorkerEffect } from "../http";
import { findOwnerSession } from "../repositories/session-repository";
import type { WorkerContext } from "../types";

export const rpc = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const procedure = new URL(request.url).pathname.slice("/rpc/".length);

  if (procedure === "getSession") {
    return findOwnerSession(context).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => json(200, null),
          onSome: (session) => json(200, session),
        }),
      ),
    );
  }

  return notImplemented(`RPC procedure is not wired yet: ${procedure}`);
};
