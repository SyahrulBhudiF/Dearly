import { expect, test } from "vitest";
import { Scene } from "foldkit";
import type { CanvasElement } from "@dearly/domain";
import { initialModel } from "../../src/core/app/model";
import { GotCanvasMessage } from "../../src/core/app/message";
import { DeselectedCanvasElement } from "../../src/core/canvas/message";
import { EntryRoute } from "../../src/core/route";
import { update } from "../../src/core/app/update";
import { view } from "../../src/view";

const element: CanvasElement = {
  id: "00000000-0000-4000-8000-000000000001" as never,
  payload: {
    kind: "image",
    mediaObjectId: "00000000-0000-4000-8000-000000000002" as never,
  },
  x: 80,
  y: 80,
  width: 480,
  height: 320,
  rotation: 0,
  layer: 0,
};

const model = {
  ...initialModel(EntryRoute({ date: "2026-07-13" as never })),
  canvas: {
    ...initialModel(EntryRoute({ date: "2026-07-13" as never })).canvas,
    elements: [element],
    selectedElementId: element.id,
  },
};

test("pointering down on blank canvas deselects its element", () => {
  Scene.scene(
    { update, view },
    Scene.with(model),
    Scene.Mount.resolve(
      { name: `canvas-${element.id}` },
      GotCanvasMessage({ message: DeselectedCanvasElement() }),
    ),
    Scene.Mount.resolve(
      { name: "canvas-paste" },
      GotCanvasMessage({ message: DeselectedCanvasElement() }),
    ),
    Scene.pointerDown(Scene.selector('[data-canvas-background="true"]')),
    Scene.tap((scene) => {
      expect(Scene.find(scene.html, '[data-canvas-controls="true"]')._tag).toBe("None");
    }),
  );
});
