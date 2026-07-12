import type { WorkerContext } from "../context";
import { json, type WorkerEffect } from "../http";

export const health = (_context: WorkerContext): WorkerEffect<Response> => json(200, { ok: true });
