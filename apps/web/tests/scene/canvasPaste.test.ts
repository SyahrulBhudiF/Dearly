import { expect, test } from "vitest";
import { initialModel } from "../../src/core/model";
import { PastedCanvasText } from "../../src/core/message";
import { EntryRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

test("pasted text creates a separate text Canvas Element", () => {
  const model = initialModel(EntryRoute({ date: "2026-07-13" as never }));
  const [next] = update(model, PastedCanvasText({ text: "Copied note" }));

  expect(next.elements).toHaveLength(1);
  expect(next.elements[0]?.payload).toMatchObject({
    kind: "text",
    document: { content: [{ content: [{ text: "Copied note" }] }] },
  });
});
