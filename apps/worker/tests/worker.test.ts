import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";
import type { AssetBinding, D1Binding } from "../src/types";

const ownerId = "00000000-0000-4000-8000-000000000001";
const mediaId = "00000000-0000-4000-8000-000000000003";
const now = "2026-07-12T00:00:00.000Z";
const document = { version: 1, logicalWidth: 1000, logicalHeight: 1000, elements: [] };

const request = (path: string, init?: RequestInit) =>
  new Request(`https://dearly.test${path}`, init);

const db = () => {
  let entry: unknown[] | undefined;

  return {
    prepare: (sql: string) => ({
      bind: (...params: ReadonlyArray<unknown>) => ({
        raw: async () => {
          if (sql.includes('from "sessions"')) {
            return params[0] === "session-1" ? [[ownerId, "owner@dearly.test", "Owner"]] : [];
          }

          if (sql.includes('from "media_objects"')) {
            return [[mediaId, ownerId, "image", "media/image.png", "image/png", 4, now]];
          }

          if (sql.includes('insert into "diary_entries"')) {
            entry = [params[0], params[1], params[2], params[3], params[4], params[5], now];
            return [entry];
          }

          if (sql.includes('from "diary_entries"') && sql.includes("limit")) {
            return entry === undefined ? [] : [entry];
          }

          if (sql.includes('from "diary_entries"')) {
            return entry === undefined ? [] : [entry];
          }

          return [];
        },
        all: async () => ({ results: [] }),
        run: async () => ({}),
      }),
    }),
  } as D1Binding;
};

const authed = { headers: { cookie: "dearly_session=session-1" } };

const saveBody = JSON.stringify({
  date: "2026-07-12",
  document,
  preview: { date: "2026-07-12", snippet: "hello", hasSavedEntry: true, hasDraft: false },
});

describe("worker routes", () => {
  it("returns health JSON", async () => {
    const response = await handleRequest(request("/health"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns null session when no session cookie exists", async () => {
    const response = await handleRequest(request("/rpc/getSession"), { DB: db() });

    expect(response.status).toBe(200);
    expect(await response.json()).toBe(null);
  });

  it("returns owner session from D1 when session cookie is valid", async () => {
    const response = await handleRequest(request("/rpc/getSession", authed), { DB: db() });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ownerId,
      email: "owner@dearly.test",
      displayName: "Owner",
    });
  });

  it("requires owner auth for entry RPC", async () => {
    const response = await handleRequest(request("/rpc/listMonthEntries"), { DB: db() });

    expect(response.status).toBe(401);
  });

  it("saves and reads a diary entry through Drizzle D1", async () => {
    const fakeDb = db();
    const saved = await handleRequest(
      request("/rpc/saveEntry", { ...authed, method: "POST", body: saveBody }),
      { DB: fakeDb },
    );

    expect(saved.status).toBe(200);
    expect(await saved.json()).toMatchObject({
      ownerId,
      date: "2026-07-12",
      document,
      preview: { snippet: "hello", hasSavedEntry: true, hasDraft: false },
    });

    const fetched = await handleRequest(
      request("/rpc/getEntryByDate", {
        ...authed,
        method: "POST",
        body: JSON.stringify({ date: "2026-07-12" }),
      }),
      { DB: fakeDb },
    );

    expect(fetched.status).toBe(200);
    expect(await fetched.json()).toMatchObject({ date: "2026-07-12" });
  });

  it("serves private media for the owner", async () => {
    const response = await handleRequest(request(`/media/${mediaId}`, authed), {
      DB: db(),
      MEDIA: {
        get: async () => ({
          body: new Response("png").body,
          arrayBuffer: async () => new TextEncoder().encode("png").buffer,
        }),
        put: async () => ({}),
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(await response.text()).toBe("png");
  });

  it("serves static assets when the binding finds one", async () => {
    const response = await handleRequest(request("/"), {
      ASSETS: {
        fetch: async () => new Response("html", { status: 200 }),
      } as AssetBinding,
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
