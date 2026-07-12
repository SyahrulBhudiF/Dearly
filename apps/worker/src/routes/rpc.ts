import type { WorkerContext } from "../types";
import { notImplemented, type WorkerEffect } from "../http";

export const rpc = (_context: WorkerContext): WorkerEffect<Response> =>
  notImplemented("Effect RPC transport is not wired yet");
