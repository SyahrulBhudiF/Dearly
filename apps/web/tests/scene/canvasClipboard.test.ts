import { expect, test } from "vitest";
import {
  CANVAS_ELEMENT_CLIPBOARD_TYPE,
  canvasElementToText,
  parseCanvasElement,
  serializeCanvasElement,
} from "../../src/canvas/clipboard";

const element = {
  id: "00000000-0000-4000-8000-000000000001" as never,
  payload: {
    kind: "image" as const,
    mediaObjectId: "00000000-0000-4000-8000-000000000002" as never,
    alt: "Photo",
  },
  x: 10,
  y: 20,
  width: 100,
  height: 80,
  rotation: 5,
  layer: 2,
};

test("Canvas Element clipboard payload is versioned and validated", () => {
  expect(CANVAS_ELEMENT_CLIPBOARD_TYPE).toBe("application/x-dearly-canvas-elements+json");
  expect(parseCanvasElement(serializeCanvasElement(element))).toEqual(element);
  expect(parseCanvasElement("not json")).toBeUndefined();
  expect(parseCanvasElement(JSON.stringify({ version: 2, element }))).toBeUndefined();
  expect(
    parseCanvasElement(JSON.stringify({ version: 1, element: { ...element, width: -1 } })),
  ).toBeUndefined();
});

test("canvasElementToText extracts human-readable clipboard text", () => {
  expect(
    canvasElementToText({
      ...element,
      payload: {
        kind: "text",
        document: {
          root: {
            type: "root",
            version: 1,
            format: "",
            indent: 0,
            direction: null,
            children: [
              {
                type: "paragraph",
                version: 1,
                format: "",
                indent: 0,
                direction: null,
                children: [{ type: "text", text: "Dear diary", version: 1 }],
              },
            ],
          },
        },
      },
    }),
  ).toBe("Dear diary");
  expect(
    canvasElementToText({
      ...element,
      payload: { kind: "image", mediaObjectId: element.payload.mediaObjectId, alt: "Photo" },
    }),
  ).toBe("Photo");
  expect(
    canvasElementToText({
      ...element,
      payload: {
        kind: "sticker",
        stickerId: "a" as never,
        mediaObjectId: "b" as never,
        emoji: "😁",
      },
    }),
  ).toBe("😁");
  expect(
    canvasElementToText({ ...element, payload: { kind: "shape", shape: "heart", color: "red" } }),
  ).toBe("heart");
});
