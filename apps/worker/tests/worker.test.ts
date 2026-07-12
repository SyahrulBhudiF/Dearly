import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";

describe("worker routes", () => {
  it("returns health JSON", async () => {
    const response = await handleRequest(new Request("https://dearly.test/health"), {});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("keeps unknown routes as JSON 404", async () => {
    const response = await handleRequest(new Request("https://dearly.test/missing"), {});
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "NotFound", message: "Route not found" });
  });
});
