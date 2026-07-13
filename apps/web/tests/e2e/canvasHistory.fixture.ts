import type { CanvasElement } from "@dearly/domain";
import { Runtime } from "foldkit";
import { initialModel, Model } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { EntryRoute } from "../../src/core/route";
import { view } from "../../src/view";

const textDocument = {
  type: "doc" as const,
  content: [{ type: "paragraph" as const }],
};
const elements: CanvasElement[] = [
  {
    id: "00000000-0000-4000-8000-000000000001" as never,
    payload: { kind: "text", document: textDocument },
    x: 80,
    y: 80,
    width: 320,
    height: 140,
    rotation: 0,
    layer: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000002" as never,
    payload: {
      kind: "image",
      mediaObjectId: "00000000-0000-4000-8000-000000000012" as never,
      alt: "Test image",
    },
    x: 500,
    y: 80,
    width: 220,
    height: 160,
    rotation: 0,
    layer: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003" as never,
    payload: {
      kind: "sticker",
      stickerId: "00000000-0000-4000-8000-000000000013" as never,
      mediaObjectId: "00000000-0000-4000-8000-000000000014" as never,
      emoji: "😁",
    },
    x: 760,
    y: 100,
    width: 120,
    height: 120,
    rotation: 0,
    layer: 2,
  },
];

const base = initialModel(EntryRoute({ date: "2026-07-14" as never }));
const seeded = {
  ...base,
  calendar: { ...base.calendar, loadState: "loaded" as const },
  entry: { ...base.entry, loadState: "loaded" as const },
  canvas: { ...base.canvas, elements },
};

window.testState = { model: seeded, messages: [] };
const application = Runtime.makeApplication({
  Model,
  init: () => [seeded, []],
  update: (model, message) => {
    const result = update(model, message);
    window.testState = {
      model: result[0],
      messages: [...window.testState.messages, message],
    };
    return result;
  },
  view,
  container: document.getElementById("root"),
  devTools: false,
});
Runtime.run(application);

declare global {
  interface Window {
    testState: {
      model: typeof seeded;
      messages: ReadonlyArray<unknown>;
    };
  }
}
