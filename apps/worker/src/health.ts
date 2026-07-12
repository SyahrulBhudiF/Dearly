import { json, type WorkerEffect } from "./libs/http";
import type { WorkerContext } from "./types";

export const health = (_context: WorkerContext): WorkerEffect<Response> => json(200, { ok: true });
