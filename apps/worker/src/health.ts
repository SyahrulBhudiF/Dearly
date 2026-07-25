import { Effect } from "effect";
import { jsonResponse } from "./http";

export const health = Effect.sync(() => jsonResponse(200, { ok: true }));
