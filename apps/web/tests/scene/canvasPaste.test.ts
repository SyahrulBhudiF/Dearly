import { expect, test } from "vitest";
import { initialModel } from "../../src/app/model";
import { GotCanvasMessage } from "../../src/app/message";
import { PastedCanvasText } from "../../src/canvas/message";
import { EntryRoute } from "../../src/route";
import { update } from "../../src/app/update";

test("pasted text creates a separate text Canvas Element", () => {
  const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
  const [next] = update(
    model,
    GotCanvasMessage({ message: PastedCanvasText({ text: "Copied note" }) }),
  );

  expect(next.canvas.elements).toHaveLength(1);
  expect(next.canvas.elements[0]?.payload).toMatchObject({
    kind: "text",
    document: { root: { children: [{ children: [{ text: "Copied note" }] }] } },
  });
});
