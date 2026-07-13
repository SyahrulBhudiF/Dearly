import { Editor } from "@tiptap/core";
import { expect, test } from "vitest";
import { initialModel } from "../../src/core/app/model";
import { GotCanvasMessage } from "../../src/core/app/message";
import { CommittedTextSession } from "../../src/core/canvas/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/app/update";
import { applyFormat, readTextFormat, richTextExtensions } from "../../src/core/canvas/richText";

const editor = () =>
  new Editor({
    extensions: richTextExtensions,
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Dearly" }] }],
    },
  });

test("cursor-only formatting applies to the whole text Canvas Element", () => {
  const instance = editor();
  applyFormat(instance, { kind: "bold" });
  applyFormat(instance, { kind: "fontFamily", value: "'Gaegu', cursive" });
  applyFormat(instance, { kind: "fontSize", value: "12px" });
  applyFormat(instance, { kind: "color", value: "rgb(1, 2, 3)" });
  applyFormat(instance, { kind: "align", value: "center" });

  expect(readTextFormat(instance)).toEqual({
    font: "'Gaegu', cursive",
    size: "12px",
    color: "rgb(1, 2, 3)",
    align: "center",
    bold: true,
    italic: false,
    underline: false,
  });
  expect(instance.getJSON()).toMatchObject({
    content: [
      {
        attrs: { textAlign: "center" },
        content: [
          {
            marks: expect.arrayContaining([
              { type: "bold" },
              {
                type: "textStyle",
                attrs: {
                  fontFamily: "'Gaegu', cursive",
                  fontSize: "12px",
                  color: "rgb(1, 2, 3)",
                },
              },
            ]),
          },
        ],
      },
    ],
  });
  instance.destroy();
});

test("formatted text document persists in its Canvas Element", () => {
  const instance = editor();
  applyFormat(instance, { kind: "bold" });
  const [next] = update(
    {
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [
          {
            id: "text-1" as never,
            payload: {
              kind: "text",
              document: { type: "doc", content: [{ type: "paragraph" }] },
            },
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rotation: 0,
            layer: 0,
          },
        ],
      },
    },
    GotCanvasMessage({
      message: CommittedTextSession({
        id: "text-1",
        sessionId: "formatting",
        document: instance.getJSON(),
        direction: "commit",
      }),
    }),
  );

  expect(next.canvas.elements[0]?.payload).toMatchObject({
    kind: "text",
    document: { content: [{ content: [{ marks: [{ type: "bold" }] }] }] },
  });
  instance.destroy();
});

test("toolbar menus close when clicking outside their menu", () => {
  const host = document.createElement("div");
  const panel = document.createElement("div");
  panel.dataset.richTextMenuPanel = "true";
  const editor = document.createElement("div");
  host.append(panel, editor);
  document.body.append(host);
  const closeMenus = () => panel.classList.add("hidden");
  const outside = (event: PointerEvent) => {
    if (!(event.target instanceof Node)) return;
    const menu =
      event.target instanceof Element
        ? event.target.closest("[data-rich-text-menu-panel], [data-rich-text-menu]")
        : null;
    if (menu === null || !host.contains(menu)) closeMenus();
  };
  document.addEventListener("pointerdown", outside, true);
  editor.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  expect(panel.classList.contains("hidden")).toBe(true);
  document.removeEventListener("pointerdown", outside, true);
  host.remove();
});
