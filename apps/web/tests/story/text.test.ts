import { expect, test } from "vitest";
import { GotCanvasMessage, GotEntryMessage } from "../../src/app/message";
import { initialModel } from "../../src/app/model";
import { update } from "../../src/app/update";
import { ChangedText } from "../../src/canvas/message";
import { LoadedEntry } from "../../src/entry/message";
import { CalendarRoute } from "../../src/route";

const initial = initialModel(CalendarRoute());

test("text changes stay with their canvas element", () => {
  const [model] = update(
    {
      ...initial,
      canvas: {
        ...initial.canvas,
        elements: [
          {
            id: "text-1" as never,
            payload: { kind: "text", document: { type: "doc", content: [] } },
            x: 80,
            y: 440,
            width: 720,
            height: 240,
            rotation: 0,
            layer: 0,
          },
        ],
      },
    },
    GotCanvasMessage({ message: ChangedText({ id: "text-1", text: "A quiet morning." }) }),
  );

  expect(model.canvas.elements).toHaveLength(1);
  expect(model.canvas.elements[0]?.payload.kind).toBe("text");
});

test("empty Diary Entries receive an editable text Canvas Element", () => {
  const [model] = update(initial, GotEntryMessage({ message: LoadedEntry({ entry: null }) }));
  expect(model.canvas.elements).toHaveLength(1);
  expect(model.canvas.elements[0]?.payload.kind).toBe("text");
});
