import { describe, expect, test } from "vitest";
import type { CanvasElement } from "@dearly/domain";
import { initialModel } from "../../src/app/model";
import { GotCanvasMessage } from "../../src/app/message";
import {
  CutCanvasElement,
  PastedCanvasElement,
  PastedCanvasText,
  RedidCanvas,
  SelectedCanvasElement,
  UndidCanvas,
} from "../../src/canvas/message";
import { EntryRoute } from "../../src/route";
import { update } from "../../src/app/update";

test("pasted text creates a separate text Canvas Element", () => {
  const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
  const [next] = update(
    model,
    GotCanvasMessage({ message: PastedCanvasText({ text: "Copied note" }) }),
  );

  expect(next.canvas.elements).toHaveLength(1);
  expect(next.canvas.elements[0]?.payload).toMatchObject({
    kind: "text",
    document: { root: { children: [{ children: [{ text: "Copied note" }] }] } },
  });
});

describe.each([
  ["text", { kind: "text", document: { root: {} } }],
  [
    "image",
    {
      kind: "image",
      mediaObjectId: "00000000-0000-4000-8000-000000000003" as never,
      alt: "Photo",
    },
  ],
  ["shape", { kind: "shape", shape: "heart", color: "red" }],
  [
    "sticker",
    {
      kind: "sticker",
      stickerId: "00000000-0000-4000-8000-000000000002" as never,
      mediaObjectId: "00000000-0000-4000-8000-000000000003" as never,
    },
  ],
  [
    "emoji",
    {
      kind: "sticker",
      stickerId: "00000000-0000-4000-8000-000000000002" as never,
      mediaObjectId: "00000000-0000-4000-8000-000000000003" as never,
      emoji: "😁",
    },
  ],
] as const)("%s clipboard payload", (_, payload) => {
  test("is preserved by internal paste", () => {
    const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
    const source: CanvasElement = {
      id: "00000000-0000-4000-8000-000000000001" as never,
      payload,
      x: 100,
      y: 120,
      width: 160,
      height: 160,
      rotation: 12,
      layer: 4,
    };
    const seeded = { ...model, canvas: { ...model.canvas, elements: [source] } };

    const [pasted] = update(
      seeded,
      GotCanvasMessage({ message: PastedCanvasElement({ element: source }) }),
    );

    expect(pasted.canvas.elements[1]?.payload).toEqual(payload);
  });
});

test("internal paste duplicates, selects, offsets, layers, and supports undo/redo", () => {
  const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
  const source = {
    id: "00000000-0000-4000-8000-000000000001" as never,
    payload: {
      kind: "sticker" as const,
      stickerId: "00000000-0000-4000-8000-000000000002" as never,
      mediaObjectId: "00000000-0000-4000-8000-000000000003" as never,
      emoji: "😁",
    },
    x: 100,
    y: 120,
    width: 160,
    height: 160,
    rotation: 12,
    layer: 4,
  };
  const seeded = { ...model, canvas: { ...model.canvas, elements: [source] } };

  const [pasted] = update(
    seeded,
    GotCanvasMessage({ message: PastedCanvasElement({ element: source }) }),
  );
  const copy = pasted.canvas.elements[1]!;

  expect(copy).toMatchObject({
    payload: source.payload,
    x: 124,
    y: 144,
    width: 160,
    height: 160,
    rotation: 12,
    layer: 5,
  });
  expect(copy.id).not.toBe(source.id);
  expect(pasted.canvas.selectedElementId).toBe(copy.id);
  expect(pasted.canvas.history.past).toHaveLength(1);

  const [undone] = update(pasted, GotCanvasMessage({ message: UndidCanvas() }));
  expect(undone.canvas.elements).toEqual([source]);

  const [redone] = update(undone, GotCanvasMessage({ message: RedidCanvas() }));
  expect(redone.canvas.elements).toEqual([source, copy]);
});

test("cut removes the selected Canvas Element as one undoable action", () => {
  const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
  const source = {
    id: "00000000-0000-4000-8000-000000000001" as never,
    payload: { kind: "shape" as const, shape: "heart" as const, color: "red" },
    x: 100,
    y: 120,
    width: 160,
    height: 160,
    rotation: 0,
    layer: 0,
  };
  const seeded = { ...model, canvas: { ...model.canvas, elements: [source] } };
  const [selected] = update(
    seeded,
    GotCanvasMessage({ message: SelectedCanvasElement({ id: source.id }) }),
  );

  const [cut] = update(selected, GotCanvasMessage({ message: CutCanvasElement() }));

  expect(cut.canvas.elements).toEqual([]);
  expect(cut.canvas.selectedElementId).toBeNull();
  expect(cut.canvas.history.past).toHaveLength(1);

  const [undone] = update(cut, GotCanvasMessage({ message: UndidCanvas() }));
  expect(undone.canvas.elements).toEqual([source]);
});
