import type { CanvasElement } from "@dearly/domain";
import { Runtime } from "foldkit";
import { initialModel, Model } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { CalendarRoute } from "../../src/core/route";
import { view } from "../../src/view";

const thumbnailId = "00000000-0000-4000-8000-000000000021";
const entryId = "00000000-0000-4000-8000-000000000022";
const textId = "00000000-0000-4000-8000-000000000023";
const imageId = "00000000-0000-4000-8000-000000000024";
const date = "2026-07-13";
const elements: ReadonlyArray<CanvasElement> = [
  {
    id: textId as never,
    payload: {
      kind: "text",
      document: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "testing" }] }],
      },
    },
    x: 100,
    y: 180,
    width: 280,
    height: 120,
    rotation: 0,
    layer: 0,
  },
  {
    id: imageId as never,
    payload: { kind: "image", mediaObjectId: imageId as never, alt: "Diagram" },
    x: 520,
    y: 120,
    width: 240,
    height: 180,
    rotation: 0,
    layer: 1,
  },
];
const base = initialModel(CalendarRoute());
const seeded = {
  ...base,
  calendar: {
    ...base.calendar,
    month: "2026-07",
    selectedDate: date,
    entries: [
      {
        date: date as never,
        snippet: "testing",
        thumbnailMediaObjectId: thumbnailId as never,
        hasSavedEntry: true,
        hasDraft: false,
      },
    ],
  },
};
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n0sAAAAASUVORK5CYII=";

window.testState = { model: seeded, uploads: 0, lastSavedThumbnailId: null };
const json = (body: unknown) =>
  new Response(`${JSON.stringify(body)}\n`, { headers: { "content-type": "application/ndjson" } });
const responseHeaders = { "content-type": "application/ndjson" };
window.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes(`/media/${imageId}`) || url.includes(`/media/${thumbnailId}`))
    return new Response(Uint8Array.from(atob(png), (char) => char.charCodeAt(0)), {
      headers: { "content-type": "image/png" },
    });
  if (url.includes("/rpc")) {
    const body = String(init?.body ?? "");
    if (body.includes("createMediaUpload")) {
      return new Response(
        `${JSON.stringify({ _tag: "Success", value: { mediaObjectId: thumbnailId, uploadUrl: `/media/${thumbnailId}`, r2Key: "test/thumbnail" } })}\n`,
        { headers: responseHeaders },
      );
    }
    if (body.includes("saveEntry")) {
      window.testState.lastSavedThumbnailId = thumbnailId;
      return json({
        _tag: "Success",
        value: {
          id: entryId,
          ownerId: entryId,
          date,
          document: { version: 1, logicalWidth: 1000, logicalHeight: 1400, elements },
          preview: {
            date,
            snippet: "testing",
            thumbnailMediaObjectId: thumbnailId,
            hasSavedEntry: true,
            hasDraft: false,
          },
          updatedAt: new Date().toISOString(),
        },
      });
    }
  }
  if (init?.method === "POST" && url.includes(`/media/${thumbnailId}`)) {
    window.testState.uploads += 1;
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 404 });
};

const application = Runtime.makeApplication({
  Model,
  init: () => [seeded, []],
  update: (model, message) => {
    const result = update(model, message);
    window.testState.model = result[0];
    return result;
  },
  view,
  container: document.getElementById("root"),
  devTools: false,
});
Runtime.run(application);

declare global {
  interface Window {
    testState: {
      model: typeof seeded;
      uploads: number;
      lastSavedThumbnailId: string | null;
    };
  }
}
