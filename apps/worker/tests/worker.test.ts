import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";

const request = (path: string, init?: RequestInit) =>
  new Request(`https://dearly.test${path}`, init);

const dbWithSession = () =>
  ({
    prepare: () => ({
      bind: () => ({
        first: async () => ({
          ownerId: "00000000-0000-4000-8000-000000000001",
          email: "owner@dearly.test",
          displayName: "Owner",
        }),
      }),
    }),
  }) as unknown as D1Database;

describe("worker routes", () => {
  it("returns health JSON", async () => {
    const response = await handleRequest(request("/health"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns null session when no session cookie exists", async () => {
    const response = await handleRequest(request("/rpc/getSession"), { DB: dbWithSession() });

    expect(response.status).toBe(200);
    expect(await response.json()).toBe(null);
  });

  it("returns owner session from D1 when session cookie is valid", async () => {
    const response = await handleRequest(
      request("/rpc/getSession", { headers: { cookie: "dearly_session=session-1" } }),
      { DB: dbWithSession() },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ownerId: "00000000-0000-4000-8000-000000000001",
      email: "owner@dearly.test",
      displayName: "Owner",
    });
  });

  it("keeps unwired rpc procedures as explicit stubs", async () => {
    const response = await handleRequest(request("/rpc/listMonthEntries"), {});

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      error: "NotImplemented",
      message: "RPC procedure is not wired yet: listMonthEntries",
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
