import { Editor } from "@tiptap/core";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { Effect, Queue, Stream } from "effect";
import type { RichTextDocument } from "@dearly/domain";
import type { CanvasMessage } from "./message";
import {
  ChangedTextFormat,
  ClosedToolbarMenu,
  CommittedTextSession,
  RedidCanvas,
  StartedTextSession,
  UndidCanvas,
  UpdatedTextDocument,
} from "./message";
import type { TextFormat } from "./model";

const extensions = [
  StarterKit.configure({ undoRedo: false }),
  TextStyle,
  FontFamily,
  FontSize,
  Color,
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
      const messages = yield* Queue.unbounded<CanvasMessage>();
      const editorNode = node.querySelector<HTMLElement>("[data-rich-text-editor]");
      const host = node.closest<HTMLElement>("[data-canvas-element]");
      if (editorNode === null || host === null) return Stream.empty;
      let sessionId = crypto.randomUUID();
      let dirty = false;
      let keydownHandledUndo = false;
      const commit = () => {
        if (!dirty) return;
        Queue.offerUnsafe(
          messages,
          CommittedTextSession({ id, sessionId, document: editor.getJSON() }),
        );
        dirty = false;
        sessionId = crypto.randomUUID();
      };
      const editor = new Editor({
        element: editorNode,
        extensions,
        content: JSON.parse(JSON.stringify(content)),
        editorProps: {
          attributes: {
            class: "size-full outline-none",
            spellcheck: "false",
          },
          handleKeyDown: (_view, event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "z") {
              event.preventDefault();
              commit();
              Queue.offerUnsafe(
                messages,
                event.shiftKey ? RedidCanvas() : UndidCanvas(),
              );
              keydownHandledUndo = true;
              return true;
            }
            keydownHandledUndo = false;
            return false;
          },
          handleDOMEvents: {
            beforeinput: (_view, event) => {
              if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
                if (keydownHandledUndo) {
                  keydownHandledUndo = false;
                  return false;
                }
                event.preventDefault();
                commit();
                Queue.offerUnsafe(
                  messages,
                  event.inputType === "historyUndo" ? UndidCanvas() : RedidCanvas(),
                );
                return true;
              }
              return false;
            },
          },
        },
        onBlur: () => {
          if (dirty) commit();
        },
        onUpdate: ({ editor }) => {
          const document = editor.getJSON();
          if (!dirty) {
            dirty = true;
            Queue.offerUnsafe(messages, StartedTextSession({ id, sessionId, document }));
          } else {
            Queue.offerUnsafe(messages, UpdatedTextDocument({ id, document }));
          }
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
      };
      const outside = (event: PointerEvent) => {
        if (!(event.target instanceof Node)) return;
        if (host.querySelector("[data-rich-text-menu-panel]:not(.hidden)") === null) return;
        const menu =
          event.target instanceof Element
            ? event.target.closest("[data-rich-text-menu-panel], [data-rich-text-menu]")
            : null;
        if (menu === null || !host.contains(menu)) Queue.offerUnsafe(messages, ClosedToolbarMenu());
      };
      const history = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest<HTMLButtonElement>(
          '[aria-label="Undo"], [aria-label="Redo"]',
        );
        if (button === null) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        commit();
        Queue.offerUnsafe(
          messages,
          button.ariaLabel === "Undo" ? UndidCanvas() : RedidCanvas(),
        );
      };
      host.addEventListener("click", format);
      document.addEventListener("click", history, true);
      document.addEventListener("pointerdown", outside, true);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            host.removeEventListener("click", format);
            document.removeEventListener("click", history, true);
            document.removeEventListener("pointerdown", outside, true);
            editor.destroy();
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
