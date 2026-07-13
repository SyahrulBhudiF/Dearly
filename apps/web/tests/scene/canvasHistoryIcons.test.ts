import type { CanvasElement } from "@dearly/domain";
import { Scene } from "foldkit";
import { test } from "vitest";
import { GotCanvasMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { DeselectedCanvasElement } from "../../src/core/canvas/message";
import { EntryRoute } from "../../src/core/route";
import { update } from "../../src/core/app/update";
import { view } from "../../src/view";

const element = (x: number): CanvasElement => ({
  id: "00000000-0000-4000-8000-000000000001" as never,
  payload: {
    kind: "image",
    mediaObjectId: "00000000-0000-4000-8000-000000000002" as never,
  },
  x,
  y: 80,
  width: 480,
  height: 320,
  rotation: 0,
  layer: 0,
});

const route = EntryRoute({ date: "2026-07-13" as never });
const base = initialModel(route);
const model = {
  ...base,
  canvas: {
    ...base.canvas,
    elements: [element(40)],
    history: { ...base.canvas.history, past: [[element(0)]] },
  },
};

const mounts = [
  Scene.Mount.resolve(
    { name: "canvas-00000000-0000-4000-8000-000000000001" },
    GotCanvasMessage({ message: DeselectedCanvasElement() }),
  ),
  Scene.Mount.resolve(
    { name: "canvas-paste" },
    GotCanvasMessage({ message: DeselectedCanvasElement() }),
  ),
] as const;

test("Undo and Redo icons use Canvas history", () => {
  Scene.scene(
    { update, view },
    Scene.with(model),
    ...mounts,
    Scene.click(Scene.role("button", { name: "Undo" })),
    Scene.expect(Scene.selector('[data-canvas-x="0"]')).toExist(),
    Scene.click(Scene.role("button", { name: "Redo" })),
    Scene.expect(Scene.selector('[data-canvas-x="40"]')).toExist(),
  );
});
