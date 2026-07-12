import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { CalendarDate, CanvasDocument, OwnerSession } from "../src/index";

describe("domain schemas", () => {
  it("accepts ISO calendar dates only", () => {
    expect(Schema.decodeUnknownResult(CalendarDate)("2026-07-12")._tag).toBe("Success");
    expect(Schema.decodeUnknownResult(CalendarDate)("07/12/2026")._tag).toBe("Failure");
  });

  it("rejects canvas elements without positive size", () => {
    const decoded = Schema.decodeUnknownResult(CanvasDocument)({
      version: 1,
      logicalWidth: 1200,
      logicalHeight: 800,
      elements: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          payload: { kind: "text", document: { type: "doc" } },
          x: 12,
          y: 24,
          width: 0,
          height: 100,
          rotation: 0,
          layer: 1,
        },
      ],
    });

    expect(decoded._tag).toBe("Failure");
  });

  it("rejects malformed owner emails", () => {
    const decoded = Schema.decodeUnknownResult(OwnerSession)({
      ownerId: "00000000-0000-4000-8000-000000000001",
      email: "not-email",
    });

    expect(decoded._tag).toBe("Failure");
  });
});
