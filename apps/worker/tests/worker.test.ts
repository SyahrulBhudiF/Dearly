import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";
import type { AssetBinding } from "../src/types";
import { authed, fakeDb, fakeR2, mediaId, request } from "./fakes";

describe("worker routes", () => {
  it("returns health JSON", async () => {
    const response = await handleRequest(request("/health"), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
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

  it("serves private media route for the owner", async () => {
    const response = await handleRequest(request(`/media/${mediaId}`, authed), {
      DB: fakeDb(),
      MEDIA: fakeR2(),
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("png");
  });

  it("keeps unknown routes as JSON 404", async () => {
    const response = await handleRequest(request("/missing"), {});

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ _tag: "NotFound", message: "Route not found" });
  });
});
