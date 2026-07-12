import { Effect } from "effect";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
} as const;

export type WorkerEffect<A> = Effect.Effect<A>;

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...securityHeaders },
  });

export const json = (status: number, body: unknown): WorkerEffect<Response> =>
  Effect.succeed(jsonResponse(status, body));

export const notFound = () => json(404, { error: "NotFound", message: "Route not found" });

export const notImplemented = (message: string) => json(501, { error: "NotImplemented", message });
