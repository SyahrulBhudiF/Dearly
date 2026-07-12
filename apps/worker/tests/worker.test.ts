import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";

const request = (path: string) => new Request(`https://dearly.test${path}`);

describe("worker routes", () => {
  it("returns health JSON", async () => {
    const response = await handleRequest(request("/health"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("keeps rpc routes as explicit stubs", async () => {
    const response = await handleRequest(request("/rpc"), {});

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      error: "NotImplemented",
      message: "Effect RPC transport is not wired yet",
    });
  });

  it("keeps private media routes as explicit stubs", async () => {
    const response = await handleRequest(request("/media/example"), {});

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      error: "NotImplemented",
      message: "Private media routes are not wired yet",
    });
  });

  it("serves static assets when the binding finds one", async () => {
    const response = await handleRequest(request("/"), {
      ASSETS: {
        fetch: async () => new Response("html", { status: 200 }),
      } as Fetcher,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("html");
  });

  it("keeps unknown routes as JSON 404", async () => {
    const response = await handleRequest(request("/missing"), {});

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "NotFound", message: "Route not found" });
  });
});
