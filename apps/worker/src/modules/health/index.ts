import type { WorkerContext } from "../../types";
import { json, type WorkerEffect } from "../../libs/http";

export const health = (_context: WorkerContext): WorkerEffect<Response> => json(200, { ok: true });
