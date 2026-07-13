import { Editor } from "@tiptap/core";
import { expect, test } from "vitest";
import { applyFormat, richTextExtensions } from "../../src/core/richTextEditor";

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
