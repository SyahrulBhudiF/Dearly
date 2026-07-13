import type { CanvasElement } from "@dearly/domain";
import { Story } from "foldkit";
import { expect, test } from "vitest";
import { GotCanvasMessage, GotEntryMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { minimumCanvasSize } from "../../src/core/canvas/drag";
import {
  AddedShape,
  ChangedCanvasElementLayer,
  ChangedTextDocument,
  ChangedShapeColor,
  DeletedCanvasElement,
  FinishedCanvasTransform,
  MovedCanvasElement,
  MovedCanvasElementLayer,
  RedidCanvas,
  ReorderedCanvasElements,
  RotatedCanvasElement,
  SelectedCanvasElement,
  StartedCanvasTransform,
  UndidCanvas,
} from "../../src/core/canvas/message";
import { DiscardedDraft } from "../../src/core/entry/message";
import { CalendarRoute, EntryRoute } from "../../src/core/route";

const element = (id: string, layer: number): CanvasElement => ({
  id: id as never,
  payload: { kind: "image", mediaObjectId: `${id}-media` as never },
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
  layer,
});
const message = (value: import("../../src/core/canvas/message").CanvasMessage) =>
  GotCanvasMessage({ message: value });

test("emoji can resize below the normal Canvas minimum", () => {
  expect(
    minimumCanvasSize({
      ...element("emoji", 0),
      payload: {
        kind: "sticker",
        stickerId: "emoji-sticker" as never,
        mediaObjectId: "emoji-media" as never,
        emoji: "😂",
      },
    }),
  ).toBe(32);
  expect(minimumCanvasSize(element("image", 0))).toBe(80);
});

test("shape uses the selected color and becomes selected", () => {
  Story.story(
    update,
    Story.with(initialModel(CalendarRoute())),
    Story.message(message(ChangedShapeColor({ color: "#d98b7b" }))),
    Story.message(message(AddedShape({ shape: "heart" }))),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.payload).toEqual({
        kind: "shape",
        shape: "heart",
        color: "#d98b7b",
      });
      expect(model.canvas.selectedElementId).toBe(model.canvas.elements[0]?.id);
    }),
  );
});

test("layers reorder by drag target or move directly to an edge", () => {
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [element("back", 0), element("middle", 1), element("front", 2)],
      },
    }),
    Story.message(message(ReorderedCanvasElements({ draggedId: "back", targetId: "front" }))),
    Story.model((model) => {
      expect(
        [...model.canvas.elements]
          .sort((left, right) => left.layer - right.layer)
          .map((item) => item.id),
      ).toEqual(["middle", "front", "back"]);
    }),
    Story.message(message(MovedCanvasElementLayer({ id: "front", edge: "back" }))),
    Story.model((model) => {
      expect(
        [...model.canvas.elements]
          .sort((left, right) => left.layer - right.layer)
          .map((item) => item.id),
      ).toEqual(["front", "middle", "back"]);
    }),
  );
});

test("one pointer gesture creates one undo step and supports redo", () => {
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [element("first", 0)],
      },
    }),
    Story.message(message(StartedCanvasTransform())),
    Story.message(message(MovedCanvasElement({ id: "first", x: 20, y: 20 }))),
    Story.message(message(MovedCanvasElement({ id: "first", x: 40, y: 40 }))),
    Story.message(message(FinishedCanvasTransform())),
    Story.message(message(UndidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.x).toBe(0);
      expect(model.canvas.elements[0]?.y).toBe(0);
    }),
    Story.message(message(RedidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.x).toBe(40);
      expect(model.canvas.elements[0]?.y).toBe(40);
    }),
  );
});

test("undo reverses an image transform before an earlier text edit", () => {
  const text = {
    ...element("text", 0),
    payload: {
      kind: "text" as const,
      document: { type: "doc" as const, content: [{ type: "paragraph" as const }] },
    },
  };
  const image = { ...element("image", 1), x: 10 };
  const changed = {
    type: "doc" as const,
    content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: "Hello" }] }],
  };
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: { ...initialModel(CalendarRoute()).canvas, elements: [text, image] },
    }),
    Story.message(message(ChangedTextDocument({ id: "text", document: changed }))),
    Story.message(message(StartedCanvasTransform())),
    Story.message(message(MovedCanvasElement({ id: "image", x: 80, y: 0 }))),
    Story.message(message(UndidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements.find(({ id }) => id === "image")?.x).toBe(10);
      expect(model.canvas.elements.find(({ id }) => id === "text")?.payload).toEqual({
        kind: "text",
        document: changed,
      });
    }),
  );
});

test("rich-text document changes share Canvas undo history", () => {
  const text = {
    ...element("text", 0),
    payload: {
      kind: "text" as const,
      document: { type: "doc" as const, content: [{ type: "paragraph" as const }] },
    },
  };
  const changed = {
    type: "doc" as const,
    content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: "Hello" }] }],
  };
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: { ...initialModel(CalendarRoute()).canvas, elements: [text] },
    }),
    Story.message(message(ChangedTextDocument({ id: "text", document: changed }))),
    Story.message(message(UndidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.payload).toEqual(text.payload);
      expect(model.canvas.history.revision).toBe(1);
    }),
  );
});

test("a new canvas edit clears redo history", () => {
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [element("first", 0)],
      },
    }),
    Story.message(message(RotatedCanvasElement({ degrees: 15 }))),
    Story.message(message(UndidCanvas())),
    Story.message(message(MovedCanvasElement({ id: "first", x: 20, y: 20 }))),
    Story.message(message(RedidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.rotation).toBe(0);
      expect(model.canvas.elements[0]?.x).toBe(20);
    }),
  );
});

test("confirming discard clears Canvas and returns to Calendar", () => {
  const [model] = update(
    {
      ...initialModel(EntryRoute({ date: "2026-07-13" as never })),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [element("first", 0)],
      },
    },
    GotEntryMessage({ message: DiscardedDraft() }),
  );
  expect(model.route._tag).toBe("CalendarRoute");
  expect(model.canvas.elements).toEqual([]);
  expect(model.canvas.history.past).toEqual([]);
});

test("selected canvas element rotates, changes layer, and deletes", () => {
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [element("first", 0), element("second", 1)],
      },
    }),
    Story.message(message(SelectedCanvasElement({ id: "first" }))),
    Story.message(message(RotatedCanvasElement({ degrees: 15 }))),
    Story.message(message(ChangedCanvasElementLayer({ direction: "forward" }))),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.rotation).toBe(15);
      expect(model.canvas.elements[0]?.layer).toBe(1);
      expect(model.canvas.elements[1]?.layer).toBe(0);
    }),
    Story.message(message(ChangedCanvasElementLayer({ direction: "backward" }))),
    Story.message(message(DeletedCanvasElement())),
    Story.model((model) => {
      expect(model.canvas.elements).toEqual([element("second", 1)]);
      expect(model.canvas.selectedElementId).toBeNull();
    }),
  );
});
