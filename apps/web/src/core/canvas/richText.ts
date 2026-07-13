import { Editor } from "@tiptap/core";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Effect, Queue, Stream } from "effect";
import type { RichTextDocument } from "@dearly/domain";
import type { CanvasMessage } from "./message";
import { ChangedTextDocument, ChangedTextFormat, ClosedToolbarMenu } from "./message";
import type { TextFormat } from "./model";

const extensions = [
  StarterKit.configure({ undoRedo: false }),
  TextStyle,
  FontFamily,
  FontSize,
  Color,
  Underline,
  Placeholder.configure({ placeholder: "Write something lovely…" }),
  TextAlign.configure({ types: ["paragraph"] }),
];

type Format =
  | { readonly kind: "bold" | "italic" | "underline" }
  | { readonly kind: "fontFamily"; readonly value: string }
  | { readonly kind: "fontSize"; readonly value: string }
  | { readonly kind: "color"; readonly value: string }
  | { readonly kind: "align"; readonly value: "left" | "center" | "right" };

export const applyFormat = (editor: Editor, format: Format) => {
  const chain = editor.chain().focus();
  const selection = editor.state.selection.empty ? chain.selectAll() : chain;
  switch (format.kind) {
    case "bold":
      selection.toggleBold().run();
      break;
    case "italic":
      selection.toggleItalic().run();
      break;
    case "underline":
      selection.toggleUnderline().run();
      break;
    case "fontFamily":
      selection.setFontFamily(format.value).run();
      break;
    case "fontSize":
      selection.setFontSize(format.value).run();
      break;
    case "color":
      selection.setColor(format.value).run();
      break;
    case "align":
      selection.setTextAlign(format.value).run();
      break;
  }
};

export const richTextExtensions = extensions;

export const readTextFormat = (editor: Editor): TextFormat => {
  const style = editor.getAttributes("textStyle");
  const paragraph = editor.getAttributes("paragraph");
  return {
    font: typeof style.fontFamily === "string" ? style.fontFamily : "inherit",
    size: typeof style.fontSize === "string" ? style.fontSize : "24px",
    color: typeof style.color === "string" ? style.color : "var(--foreground)",
    align:
      paragraph.textAlign === "center" || paragraph.textAlign === "right"
        ? paragraph.textAlign
        : "left",
    bold: editor.isActive("bold"),
    italic: editor.isActive("italic"),
    underline: editor.isActive("underline"),
  };
};

export const richTextEditor = (
  id: string,
  content: RichTextDocument,
  node: Element,
): Stream.Stream<CanvasMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<CanvasMessage>(16);
      const editorNode = node.querySelector<HTMLElement>("[data-rich-text-editor]");
      const host = node.closest<HTMLElement>("[data-canvas-element]");
      if (editorNode === null || host === null) return Stream.empty;
      const editor = new Editor({
        element: editorNode,
        extensions,
        content: JSON.parse(JSON.stringify(content)),
        editorProps: {
          attributes: {
            class: "size-full outline-none",
            spellcheck: "false",
          },
        },
        onUpdate: ({ editor }) => {
          Queue.offerUnsafe(messages, ChangedTextDocument({ id, document: editor.getJSON() }));
          Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));
        },
        onSelectionUpdate: ({ editor }) =>
          Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) })),
      });
      Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));
      const format = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const action =
          target.closest<HTMLButtonElement>("[data-rich-text-action]")?.dataset.richTextAction;
        const family = target.closest<HTMLButtonElement>("[data-rich-text-font-family]")?.dataset
          .richTextFontFamily;
        const size = target.closest<HTMLButtonElement>("[data-rich-text-font-size]")?.dataset
          .richTextFontSize;
        const color =
          target.closest<HTMLButtonElement>("[data-rich-text-color]")?.dataset.richTextColor;
        const align =
          target.closest<HTMLButtonElement>("[data-rich-text-align]")?.dataset.richTextAlign;
        if (
          action === undefined &&
          family === undefined &&
          size === undefined &&
          color === undefined &&
          align === undefined
        )
          return;
        event.preventDefault();
        if (action !== undefined)
          applyFormat(editor, { kind: action as "bold" | "italic" | "underline" });
        if (family !== undefined) applyFormat(editor, { kind: "fontFamily", value: family });
        if (size !== undefined) applyFormat(editor, { kind: "fontSize", value: size });
        if (color !== undefined) applyFormat(editor, { kind: "color", value: color });
        if (align !== undefined)
          applyFormat(editor, { kind: "align", value: align as "left" | "center" | "right" });
        Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));
        Queue.offerUnsafe(messages, ClosedToolbarMenu());
      };
      const outside = (event: PointerEvent) => {
        if (!(event.target instanceof Node)) return;
        const menu =
          event.target instanceof Element
            ? event.target.closest("[data-rich-text-menu-panel], [data-rich-text-menu]")
            : null;
        if (menu === null || !host.contains(menu)) Queue.offerUnsafe(messages, ClosedToolbarMenu());
      };
      host.addEventListener("click", format);
      document.addEventListener("pointerdown", outside, true);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            host.removeEventListener("click", format);
            document.removeEventListener("pointerdown", outside, true);
            editor.destroy();
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
