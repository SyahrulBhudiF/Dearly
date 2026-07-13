import { expect, test } from "vitest";
import { canvasControlsPlacement, canvasElementZIndex } from "../../src/page/components/element";

test("selected Canvas Element enters a temporary editing layer", () => {
  expect(canvasElementZIndex(1, false)).toBe(2);
  expect(canvasElementZIndex(1, true)).toBe(10_000);
});

test("controls choose an unobstructed side at every canvas boundary", () => {
  expect(canvasControlsPlacement({ x: 200, y: 120, width: 160, height: 100 })).toBe("top");
  expect(canvasControlsPlacement({ x: 1040, y: 120, width: 160, height: 100 })).toBe("left");
  expect(canvasControlsPlacement({ x: -40, y: 120, width: 160, height: 100 })).toBe("right");
  expect(canvasControlsPlacement({ x: 400, y: 10, width: 160, height: 100 })).toBe("bottom");
  expect(canvasControlsPlacement({ x: 1040, y: 10, width: 160, height: 100 })).toBe("left");
  expect(canvasControlsPlacement({ x: 400, y: 730, width: 160, height: 100 })).toBe("top");
});
