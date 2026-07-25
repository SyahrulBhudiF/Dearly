import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from "lexical";
import { registerRichText } from "@lexical/rich-text";
import { expect, test } from "vitest";
import { initialModel } from "../../src/app/model";
import { GotCanvasMessage } from "../../src/app/message";
import { CommittedTextSession } from "../../src/canvas/message";
import { applyFormat, readTextFormat } from "../../src/canvas/richText";
import { CalendarRoute } from "../../src/route";
import { update } from "../../src/app/update";

const lexicalDocument = (text: string) => ({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children:
          text === ""
            ? []
            : [{ type: "text", version: 1, text, format: 0, detail: 0, mode: "normal", style: "" }],
      },
    ],
  },
});

const editor = () => {
  const instance = createEditor({ namespace: "rich-text-test", onError: console.error });
  const root = document.createElement("div");
  document.body.append(root);
  instance.setRootElement(root);
  const unregister = registerRichText(instance);
  instance.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Dearly"));
      $getRoot().append(paragraph);
      paragraph.selectEnd();
    },
    { discrete: true },
  );
  return {
    instance,
    destroy: () => {
      unregister();
      instance.setRootElement(null);
      root.remove();
    },
  };
};

test("cursor-only formatting applies to the whole text Canvas Element", () => {
  const { instance, destroy } = editor();
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
  expect(instance.getEditorState().toJSON()).toMatchObject({
    root: {
      children: [
        {
          format: "center",
          children: [
            { format: 1, style: expect.stringContaining("font-family: 'Gaegu', cursive") },
          ],
        },
      ],
    },
  });
  destroy();
});

test("formatted text document persists in its Canvas Element", () => {
  const { instance, destroy } = editor();
  applyFormat(instance, { kind: "bold" });
  const [next] = update(
    {
      ...initialModel(CalendarRoute()),
      canvas: {
        ...initialModel(CalendarRoute()).canvas,
        elements: [
          {
            id: "text-1" as never,
            payload: { kind: "text", document: lexicalDocument("") },
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
        document: instance.getEditorState().toJSON(),
      }),
    }),
  );

  expect(next.canvas.elements[0]?.payload).toMatchObject({
    kind: "text",
    document: { root: { children: [{ children: [{ format: 1 }] }] } },
  });
  destroy();
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
