import type { CanvasElement } from "@dearly/domain";
import { Story } from "foldkit";
import { expect, test } from "vitest";
import { GotCanvasMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import {
  ChangedCanvasElementLayer,
  DeletedCanvasElement,
  RotatedCanvasElement,
  SelectedCanvasElement,
} from "../../src/core/canvas/message";
import { CalendarRoute } from "../../src/core/route";

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
