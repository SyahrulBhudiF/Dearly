import { expect, test } from "vitest";
import { Story } from "foldkit";
import type { CanvasElement } from "@dearly/domain";
import { initialModel } from "../../src/core/model";
import {
  ChangedCanvasElementLayer,
  DeletedCanvasElement,
  RotatedCanvasElement,
  SelectedCanvasElement,
} from "../../src/core/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

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

test("selected canvas element rotates, changes layer, and deletes", () => {
  Story.story(
    update,
    Story.with({
      ...initialModel(CalendarRoute()),
      elements: [element("first", 0), element("second", 1)],
    }),
    Story.message(SelectedCanvasElement({ id: "first" })),
    Story.message(RotatedCanvasElement({ degrees: 15 })),
    Story.message(ChangedCanvasElementLayer({ direction: "forward" })),
    Story.model((model) => {
      expect(model.elements[0]?.rotation).toBe(15);
      expect(model.elements[0]?.layer).toBe(1);
      expect(model.elements[1]?.layer).toBe(0);
    }),
    Story.message(ChangedCanvasElementLayer({ direction: "backward" })),
    Story.model((model) => {
      expect(model.elements[0]?.layer).toBe(0);
      expect(model.elements[1]?.layer).toBe(1);
    }),
    Story.message(DeletedCanvasElement()),
    Story.model((model) => {
      expect(model.elements).toEqual([element("second", 1)]);
      expect(model.selectedElementId).toBeNull();
    }),
  );
});
