import { expect, test } from "vitest";
import { initialModel } from "../../src/core/model";
import { ChangedText, LoadedEntry } from "../../src/core/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

test("text changes stay with their canvas element", () => {
  const [model] = update(
    {
      ...initialModel(CalendarRoute()),
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
    ChangedText({ id: "text-1", text: "A quiet morning." }),
  );

  expect(model.elements).toHaveLength(1);
  expect(model.elements[0]?.payload.kind).toBe("text");
  expect(model.elements[0]?.x).toBe(80);
});

test("empty Diary Entries receive an editable text Canvas Element", () => {
  const [model] = update(initialModel(CalendarRoute()), LoadedEntry({ entry: null }));
  expect(model.elements).toHaveLength(1);
  expect(model.elements[0]?.payload.kind).toBe("text");
  if (model.elements[0]?.payload.kind === "text")
    expect(model.elements[0].payload.document.content).toEqual([{ type: "paragraph" }]);
});
