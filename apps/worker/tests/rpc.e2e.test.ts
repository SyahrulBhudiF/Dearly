import { describe, expect, it } from "@effect/vitest";
import { handleRequest } from "../src/index";
import {
  authed,
  document,
  fakeDb,
  jsonPost,
  mediaId,
  ownerId,
  request,
  savePayload,
  stickerId,
} from "./fakes";

describe("RPC e2e", () => {
  it("getSession: positive and negative", async () => {
    const ok = await handleRequest(request("/rpc/getSession", authed), { DB: fakeDb() });
    const none = await handleRequest(request("/rpc/getSession", authed), {
      DB: fakeDb({ hasSession: false }),
    });

    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ownerId, email: "owner@dearly.test", displayName: "Owner" });
    expect(none.status).toBe(200);
    expect(await none.json()).toBe(null);
  });

  it("listMonthEntries: positive and negative", async () => {
    const db = fakeDb();
    await handleRequest(request("/rpc/saveEntry", jsonPost(savePayload)), { DB: db });

    const ok = await handleRequest(
      request("/rpc/listMonthEntries", jsonPost({ month: "2026-07" })),
      { DB: db },
    );
    const unauthorized = await handleRequest(
      request("/rpc/listMonthEntries", {
        method: "POST",
        body: JSON.stringify({ month: "2026-07" }),
      }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(
      request("/rpc/listMonthEntries", jsonPost({ month: "2026/07" })),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual([
      { date: "2026-07-12", snippet: "hello", hasSavedEntry: true, hasDraft: false },
    ]);
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
  });

  it("getEntryByDate: positive and negative", async () => {
    const db = fakeDb();
    await handleRequest(request("/rpc/saveEntry", jsonPost(savePayload)), { DB: db });

    const ok = await handleRequest(
      request("/rpc/getEntryByDate", jsonPost({ date: "2026-07-12" })),
      { DB: db },
    );
    const missing = await handleRequest(
      request("/rpc/getEntryByDate", jsonPost({ date: "2026-07-12" })),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(
      request("/rpc/getEntryByDate", jsonPost({ date: "12/07/2026" })),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ ownerId, date: "2026-07-12", document });
    expect(missing.status).toBe(404);
    expect(bad.status).toBe(400);
  });

  it("saveEntry: positive and negative", async () => {
    const ok = await handleRequest(request("/rpc/saveEntry", jsonPost(savePayload)), {
      DB: fakeDb(),
    });
    const unauthorized = await handleRequest(
      request("/rpc/saveEntry", { method: "POST", body: JSON.stringify(savePayload) }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(request("/rpc/saveEntry", jsonPost({})), { DB: fakeDb() });

    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ ownerId, date: "2026-07-12", document });
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
  });

  it("discardServerEntry: positive and negative", async () => {
    const db = fakeDb();
    await handleRequest(request("/rpc/saveEntry", jsonPost(savePayload)), { DB: db });

    const ok = await handleRequest(
      request("/rpc/discardServerEntry", jsonPost({ date: "2026-07-12" })),
      { DB: db },
    );
    const missingAfterDelete = await handleRequest(
      request("/rpc/getEntryByDate", jsonPost({ date: "2026-07-12" })),
      { DB: db },
    );
    const unauthorized = await handleRequest(
      request("/rpc/discardServerEntry", {
        method: "POST",
        body: JSON.stringify({ date: "2026-07-12" }),
      }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(request("/rpc/discardServerEntry", jsonPost({ date: "bad" })), {
      DB: fakeDb(),
    });

    expect(ok.status).toBe(200);
    expect(await ok.json()).toBe(null);
    expect(missingAfterDelete.status).toBe(404);
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
  });

  it("createMediaUpload: positive and negative", async () => {
    const ok = await handleRequest(
      request(
        "/rpc/createMediaUpload",
        jsonPost({ kind: "image", mimeType: "image/png", sizeBytes: 4 }),
      ),
      { DB: fakeDb() },
    );
    const unauthorized = await handleRequest(
      request("/rpc/createMediaUpload", {
        method: "POST",
        body: JSON.stringify({ kind: "image", mimeType: "image/png", sizeBytes: 4 }),
      }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(request("/rpc/createMediaUpload", jsonPost({})), {
      DB: fakeDb(),
    });
    const oversized = await handleRequest(
      request(
        "/rpc/createMediaUpload",
        jsonPost({ kind: "image", mimeType: "image/png", sizeBytes: 20_000_000 }),
      ),
      { DB: fakeDb() },
    );
    const unsupported = await handleRequest(
      request(
        "/rpc/createMediaUpload",
        jsonPost({ kind: "image", mimeType: "text/plain", sizeBytes: 4 }),
      ),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect((await ok.json()).uploadUrl.startsWith("/media/")).toBe(true);
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(unsupported.status).toBe(415);
  });

  it("getMediaObject: positive and negative", async () => {
    const ok = await handleRequest(
      request("/rpc/getMediaObject", jsonPost({ mediaObjectId: mediaId })),
      { DB: fakeDb() },
    );
    const missing = await handleRequest(
      request("/rpc/getMediaObject", jsonPost({ mediaObjectId: mediaId })),
      { DB: fakeDb({ media: null }) },
    );
    const bad = await handleRequest(
      request("/rpc/getMediaObject", jsonPost({ mediaObjectId: "nope" })),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ id: mediaId, ownerId, mimeType: "image/png" });
    expect(missing.status).toBe(404);
    expect(bad.status).toBe(400);
  });

  it("listStickers: positive and negative", async () => {
    const ok = await handleRequest(request("/rpc/listStickers", authed), { DB: fakeDb() });
    const unauthorized = await handleRequest(request("/rpc/listStickers"), { DB: fakeDb() });

    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject([
      { id: stickerId, ownerId, mediaObjectId: mediaId, label: "heart" },
    ]);
    expect(unauthorized.status).toBe(401);
  });

  it("createSticker: positive and negative", async () => {
    const ok = await handleRequest(
      request("/rpc/createSticker", jsonPost({ mediaObjectId: mediaId, label: "wow" })),
      { DB: fakeDb() },
    );
    const unauthorized = await handleRequest(
      request("/rpc/createSticker", {
        method: "POST",
        body: JSON.stringify({ mediaObjectId: mediaId, label: "wow" }),
      }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(
      request("/rpc/createSticker", jsonPost({ mediaObjectId: "nope", label: "wow" })),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ ownerId, mediaObjectId: mediaId, label: "wow" });
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
  });

  it("deleteStickerFromPicker: positive and negative", async () => {
    const db = fakeDb();
    const ok = await handleRequest(
      request("/rpc/deleteStickerFromPicker", jsonPost({ stickerId })),
      { DB: db },
    );
    const empty = await handleRequest(request("/rpc/listStickers", authed), { DB: db });
    const unauthorized = await handleRequest(
      request("/rpc/deleteStickerFromPicker", {
        method: "POST",
        body: JSON.stringify({ stickerId }),
      }),
      { DB: fakeDb() },
    );
    const bad = await handleRequest(
      request("/rpc/deleteStickerFromPicker", jsonPost({ stickerId: "nope" })),
      { DB: fakeDb() },
    );

    expect(ok.status).toBe(200);
    expect(await ok.json()).toBe(null);
    expect(await empty.json()).toEqual([]);
    expect(unauthorized.status).toBe(401);
    expect(bad.status).toBe(400);
  });
});
