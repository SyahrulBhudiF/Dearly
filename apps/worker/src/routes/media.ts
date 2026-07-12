import type { WorkerContext } from "../types";
import { notImplemented, type WorkerEffect } from "../http";

export const media = (_context: WorkerContext): WorkerEffect<Response> =>
  notImplemented("Private media routes are not wired yet");
