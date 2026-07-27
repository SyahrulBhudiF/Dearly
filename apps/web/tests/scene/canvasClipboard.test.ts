import { expect, test } from "vitest";
import {
  CANVAS_ELEMENT_CLIPBOARD_TYPE,
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
