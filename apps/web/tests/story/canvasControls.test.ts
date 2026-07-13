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
  CommittedTextSession,
  ChangedShapeColor,
  DeletedCanvasElement,
  FinishedCanvasTransform,
  MovedCanvasElement,
  MovedCanvasElementLayer,
  RedidCanvas,
  ReorderedCanvasElements,
  RotatedCanvasElement,
  TransformedCanvasElement,
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

test("committed text session creates one Canvas history entry", () => {
  const document = (value: string) => ({
    type: "doc" as const,
    content: [
      {
        type: "paragraph" as const,
        ...(value === "" ? {} : { content: [{ type: "text" as const, text: value }] }),
      },
    ],
  });
  const text = {
    ...element("text", 0),
    payload: { kind: "text" as const, document: document("") },
  };
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: { ...initialModel(CalendarRoute()).canvas, elements: [text] },
    }),
    Story.message(
      message(
        CommittedTextSession({
          id: "text",
          sessionId: "typing-1",
          document: document("typed quickly"),
          direction: "commit",
        }),
      ),
    ),
    Story.model((model) => {
      expect(model.canvas.history.past).toHaveLength(1);
      expect(model.canvas.elements[0]?.payload).toEqual({
        kind: "text",
        document: document("typed quickly"),
      });
    }),
    Story.message(message(UndidCanvas())),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.payload).toEqual({ kind: "text", document: document("") });
    }),
  );
});

test("committed text session and undo are atomic", () => {
  const empty = { type: "doc" as const, content: [{ type: "paragraph" as const }] };
  const typed = {
    type: "doc" as const,
    content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: "abc" }] }],
  };
  const text = { ...element("text", 0), payload: { kind: "text" as const, document: empty } };
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      canvas: { ...initialModel(CalendarRoute()).canvas, elements: [text] },
    }),
    Story.message(
      message(
        CommittedTextSession({
          id: "text",
          sessionId: "typing-1",
          document: typed,
          direction: "undo",
        }),
      ),
    ),
    Story.model((model) => {
      expect(model.canvas.elements[0]?.payload).toEqual({ kind: "text", document: empty });
      expect(model.canvas.history.future).toHaveLength(1);
    }),
  );
});

test("50 real-world mixed actions undo and redo every full Canvas snapshot", () => {
  const document = (value: string) => ({
    type: "doc" as const,
    content: [
      {
        type: "paragraph" as const,
        ...(value === "" ? {} : { content: [{ type: "text" as const, text: value }] }),
      },
    ],
  });
  const text: CanvasElement = {
    ...element("text", 0),
    payload: { kind: "text", document: document("") },
  };
  const sticker: CanvasElement = {
    ...element("sticker", 1),
    payload: {
      kind: "sticker",
      stickerId: "sticker-id" as never,
      mediaObjectId: "sticker-media" as never,
      emoji: "😁",
    },
  };
  const image = element("image", 2);
  const shape: CanvasElement = {
    ...element("shape", 3),
    payload: { kind: "shape", shape: "rectangle", color: "#fda4af" },
  };
  let model = {
    ...initialModel(CalendarRoute()),
    canvas: {
      ...initialModel(CalendarRoute()).canvas,
      elements: [text, sticker, image, shape],
    },
  };
  const snapshots: ReadonlyArray<CanvasElement>[] = [structuredClone(model.canvas.elements)];
  const apply = (...messages: ReadonlyArray<Parameters<typeof message>[0]>) => {
    for (const value of messages) [model] = update(model, message(value));
    snapshots.push(structuredClone(model.canvas.elements));
  };

  const schedule = [
    "sticker",
    "layer",
    "text",
    "image",
    "layer",
    "layer",
    "image",
    "sticker",
    "text",
    "layer",
    "image",
    "layer",
    "sticker",
    "layer",
    "text",
    "sticker",
    "image",
    "layer",
    "layer",
    "text",
    "layer",
    "sticker",
    "text",
    "image",
    "layer",
    "image",
    "layer",
    "text",
    "sticker",
    "layer",
    "text",
    "layer",
    "image",
    "sticker",
    "layer",
    "layer",
    "sticker",
    "image",
    "text",
    "layer",
    "image",
    "text",
    "layer",
    "sticker",
    "layer",
    "sticker",
    "layer",
    "text",
    "image",
    "layer",
  ] as const;
  const counts = { text: 0, sticker: 0, image: 0, layer: 0 };
  for (const kind of schedule) {
    const index = counts[kind]++;
    if (kind === "text") {
      apply(
        CommittedTextSession({
          id: "text",
          sessionId: `text-${index}`,
          document: document(`entry ${index}`),
          direction: "commit",
        }),
      );
    } else if (kind === "layer") {
      const ordered = [...model.canvas.elements].sort((a, b) => a.layer - b.layer);
      apply(ReorderedCanvasElements({ draggedId: ordered[0]!.id, targetId: ordered.at(-1)!.id }));
    } else {
      const offset = index * 10;
      apply(
        StartedCanvasTransform(),
        TransformedCanvasElement({
          id: kind,
          x: (kind === "sticker" ? 20 : 40) + offset,
          y: (kind === "sticker" ? 30 : 50) + offset,
          width: (kind === "sticker" ? 100 : 140) + index,
          height: (kind === "sticker" ? 110 : 150) + index,
          rotation: index * (kind === "sticker" ? 3 : 5),
        }),
        FinishedCanvasTransform(),
      );
    }
    if (snapshots.length % 7 === 0) {
      const current = snapshots.at(-1)!;
      const previous = snapshots.at(-2)!;
      [model] = update(model, message(UndidCanvas()));
      expect(model.canvas.elements).toEqual(previous);
      [model] = update(model, message(RedidCanvas()));
      expect(model.canvas.elements).toEqual(current);
    }
  }
  expect(counts).toEqual({ text: 10, sticker: 10, image: 10, layer: 20 });

  expect(snapshots).toHaveLength(51);
  expect(model.canvas.history.past).toHaveLength(50);
  for (let index = 49; index >= 0; index -= 1) {
    [model] = update(model, message(UndidCanvas()));
    expect(model.canvas.elements).toEqual(snapshots[index]);
  }
  expect(model.canvas.history.future).toHaveLength(50);
  for (let index = 1; index <= 50; index += 1) {
    [model] = update(model, message(RedidCanvas()));
    expect(model.canvas.elements).toEqual(snapshots[index]);
  }
  expect(model.canvas.history.past).toHaveLength(50);
  expect(model.canvas.history.future).toHaveLength(0);
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
