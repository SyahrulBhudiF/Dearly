import { describe, expect, it } from "@effect/vitest";
import { Option } from "effect";
import { clearSessionCookie, sessionCookie, sessionIdFromRequest } from "../src/libs/session";

describe("session cookies", () => {
  it("reads the Dearly session cookie", () => {
    const request = new Request("https://dearly.test", {
      headers: { cookie: "other=1; dearly_session=session%201" },
    });

    expect(sessionIdFromRequest(request)).toEqual(Option.some("session 1"));
  });

  it("returns none when the cookie is absent", () => {
    expect(sessionIdFromRequest(new Request("https://dearly.test"))).toEqual(Option.none());
  });

  it("marks session cookies as private same-origin cookies", () => {
    expect(sessionCookie("abc")).toContain("HttpOnly; Secure; SameSite=Lax");
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });
});
