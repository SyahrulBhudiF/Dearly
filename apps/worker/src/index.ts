export interface DearlyEnv {
  readonly ASSETS?: Fetcher;
  readonly DB?: D1Database;
  readonly MEDIA?: R2Bucket;
}

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
} as const;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...securityHeaders },
  });

const notFound = () => json(404, { error: "NotFound", message: "Route not found" });

export const handleRequest = async (request: Request, env: DearlyEnv): Promise<Response> => {
  const url = new URL(request.url);

  if (url.pathname === "/health") {
    return json(200, { ok: true });
  }

  if (url.pathname.startsWith("/rpc")) {
    return json(501, { error: "NotImplemented", message: "Effect RPC transport is not wired yet" });
  }

  if (env.ASSETS !== undefined) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers: assetResponse.headers,
      });
    }
  }

  return notFound();
};

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<DearlyEnv>;
