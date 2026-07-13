import { expect, test } from "vitest";
import { resolveLayerDropTarget } from "../../src/core/canvas/layerDrop";

test("commits the optimistic sortable index when dragend target returns to source", () => {
  expect(resolveLayerDropTarget(["shape", "text"], 1, 0, "text")).toBe("shape");
  expect(resolveLayerDropTarget(["shape", "text"], 0, 1, "shape")).toBe("text");
});

test("ignores a drop that did not change index", () => {
  expect(resolveLayerDropTarget(["shape", "text"], 0, 0, "shape")).toBeNull();
});
