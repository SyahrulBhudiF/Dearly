import { Schema } from "effect";
import { describe, expect, it } from "@effect/vitest";
import { DearlyRpc } from "../src/index";

const rpcTags = () => [...DearlyRpc.requests.keys()].toSorted();

describe("DearlyRpc", () => {
  it("declares the first-version diary procedures", () => {
    expect(rpcTags()).toEqual([
      "createMediaUpload",
      "createSticker",
      "deleteStickerFromPicker",
      "discardServerEntry",
      "getEntryByDate",
      "getMediaObject",
      "getSession",
      "listImages",
      "listMonthEntries",
      "listStickers",
      "saveEntry",
    ]);
  });

  it("validates calendar lookup payloads", () => {
    const rpc = DearlyRpc.requests.get("getEntryByDate");

    expect(rpc).toBeDefined();
    expect(Schema.decodeUnknownResult(rpc!.payloadSchema)({ date: "2026-07-12" })._tag).toBe(
      "Success",
    );
    expect(Schema.decodeUnknownResult(rpc!.payloadSchema)({ date: "12/07/2026" })._tag).toBe(
      "Failure",
    );
  });
});
