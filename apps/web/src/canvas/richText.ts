import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  createEditor,
  KEY_DOWN_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { createEmptyHistoryState, registerHistory } from "@lexical/history";
import { registerRichText } from "@lexical/rich-text";
import { Effect, Option, Queue, Stream } from "effect";
import { fromEventFilterMap } from "foldkit/subscription";
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

type Format =
  | { readonly kind: "bold" | "italic" | "underline" }
  | { readonly kind: "fontFamily"; readonly value: string }
  | { readonly kind: "fontSize"; readonly value: string }
  | { readonly kind: "color"; readonly value: string }
  | { readonly kind: "align"; readonly value: "left" | "center" | "right" };

const styleValue = (style: string, property: string) =>
  style
    .split(";")
    .map((declaration) => declaration.trim().split(/:\s*/, 2))
    .find(([name]) => name === property)?.[1];

const setStyle = (style: string, property: string, value: string) =>
  `${style
    .split(";")
    .filter(
      (declaration) => declaration.trim() !== "" && !declaration.trim().startsWith(`${property}:`),
    )
    .join("; ")}${style === "" ? "" : "; "}${property}: ${value};`;

const withTextSelection = (
  editor: LexicalEditor,
  f: (selection: ReturnType<typeof $getSelection>) => void,
) =>
  editor.update(
    () => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) f(selection);
    },
    { discrete: true },
  );

export const applyFormat = (editor: LexicalEditor, format: Format) =>
  withTextSelection(editor, (selection) => {
    if (!$isRangeSelection(selection)) return;
    const textNodes = selection.isCollapsed()
      ? $getRoot().getAllTextNodes()
      : selection.getNodes().filter($isTextNode);
    if (format.kind === "bold" || format.kind === "italic" || format.kind === "underline") {
      for (const node of textNodes) node.toggleFormat(format.kind);
      return;
    }
    if (format.kind === "align") {
      const elements = selection.isCollapsed()
        ? $getRoot().getChildren().filter($isElementNode)
        : selection
            .getNodes()
            .map((node) => node.getTopLevelElement())
            .filter($isElementNode);
      for (const element of new Set(elements)) element.setFormat(format.value);
      return;
    }
    if (format.kind === "fontFamily") {
      selection.setStyle(setStyle(selection.style, "font-family", format.value));
      for (const node of textNodes)
        node.setStyle(setStyle(node.getStyle(), "font-family", format.value));
      return;
    }
    if (format.kind === "fontSize") {
      selection.setStyle(setStyle(selection.style, "font-size", format.value));
      for (const node of textNodes)
        node.setStyle(setStyle(node.getStyle(), "font-size", format.value));
      return;
    }
    if (format.kind === "color") {
      selection.setStyle(setStyle(selection.style, "color", format.value));
      for (const node of textNodes) node.setStyle(setStyle(node.getStyle(), "color", format.value));
    }
  });

export const readTextFormat = (editor: LexicalEditor): TextFormat =>
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return defaultTextFormat;
    const text = selection.isCollapsed()
      ? $getRoot().getAllTextNodes()[0]
      : selection.getNodes().find($isTextNode);
    const style = text?.getStyle() ?? selection.style;
    const element = text?.getTopLevelElement();
    const align = $isElementNode(element) ? element.getFormatType() : "left";
    return {
      font: styleValue(style, "font-family") ?? "inherit",
      size: styleValue(style, "font-size") ?? "24px",
      color: styleValue(style, "color") ?? "var(--foreground)",
      align: align === "center" || align === "right" ? align : "left",
      bold: text?.hasFormat("bold") ?? false,
      italic: text?.hasFormat("italic") ?? false,
      underline: text?.hasFormat("underline") ?? false,
    };
  });

const defaultTextFormat: TextFormat = {
  font: "inherit",
  size: "24px",
  color: "var(--foreground)",
  align: "left",
  bold: false,
  italic: false,
  underline: false,
};

const documentOf = (editor: LexicalEditor) => editor.getEditorState().toJSON() as RichTextDocument;

const setEmpty = (node: HTMLElement, editor: LexicalEditor) =>
  node.toggleAttribute(
    "data-empty",
    editor.getEditorState().read(() => $getRoot().getTextContent() === ""),
  );

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
      const editor = createEditor({ namespace: `dearly-${id}`, onError: console.error });
      editor.setRootElement(editorNode);
      editor.setEditorState(editor.parseEditorState(JSON.stringify(content)));
      editor.setEditable(false);
      setEmpty(editorNode, editor);
      const commit = () => {
        if (!dirty) return;
        Queue.offerUnsafe(
          messages,
          CommittedTextSession({ id, sessionId, document: documentOf(editor) }),
        );
        dirty = false;
        sessionId = crypto.randomUUID();
      };
      const enterEditMode = (event: Event) => {
        if (event instanceof PointerEvent && event.detail !== 2) return;
        if (!(event.target instanceof Element) || event.target.closest("[data-canvas-controls]"))
          return;
        editorNode.contentEditable = "true";
        editor.setEditable(true);
        editorNode.focus();
        host.setAttribute("data-editing", "true");
      };
      const exitEditMode = () => {
        commit();
        editorNode.contentEditable = "false";
        editor.setEditable(false);
        host.removeAttribute("data-editing");
      };
      const unregisterRichText = registerRichText(editor);
      const unregisterUpdate = editor.registerUpdateListener(
        ({ editorState, dirtyElements, dirtyLeaves }) => {
          if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
            Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));
            return;
          }
          editorNode.toggleAttribute(
            "data-empty",
            editorState.read(() => $getRoot().getTextContent() === ""),
          );
          const document = editorState.toJSON() as RichTextDocument;
          if (!dirty) {
            dirty = true;
            Queue.offerUnsafe(messages, StartedTextSession({ id, sessionId, document }));
          } else Queue.offerUnsafe(messages, UpdatedTextDocument({ id, document }));
          Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));
        },
      );
      const unregisterKeydown = editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "z") {
            event.preventDefault();
            commit();
            Queue.offerUnsafe(messages, event.shiftKey ? RedidCanvas() : UndidCanvas());
            keydownHandledUndo = true;
            return true;
          }
          keydownHandledUndo = false;
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      );
      // Track Lexical history pushes via onHistoryStateChange and commit each
      // push to the canvas history so every text edit group creates its own
      // undo step. The delay (300ms) merges rapid keystrokes into one entry.
      let previousUndoStackLength = 0;
      const unregisterHistory = registerHistory(
        editor,
        createEmptyHistoryState(),
        300,
        undefined,
        (state) => {
          if (state.undoStack.length > previousUndoStackLength) {
            previousUndoStackLength = state.undoStack.length;
            commit();
          }
          previousUndoStackLength = state.undoStack.length;
        },
        200,
      );
      // Block Lexical's internal undo/redo commands — the canvas owns undo.
      const unregisterBlockUndo = editor.registerCommand(
        UNDO_COMMAND,
        () => true,
        COMMAND_PRIORITY_HIGH,
      );
      const unregisterBlockRedo = editor.registerCommand(
        REDO_COMMAND,
        () => true,
        COMMAND_PRIORITY_HIGH,
      );
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
      Queue.offerUnsafe(messages, ChangedTextFormat({ format: readTextFormat(editor) }));

      return Stream.mergeAll({ concurrency: "unbounded" })([
        Stream.fromQueue(messages),

        fromEventFilterMap<Event, CanvasMessage>({
          target: host,
          type: "canvas-text-edit",
          toMessage: (event) => {
            enterEditMode(event);
            return Option.none();
          },
        }),

        fromEventFilterMap<Event, CanvasMessage>({
          target: host,
          type: "click",
          toMessage: (event) => {
            format(event);
            return Option.none();
          },
        }),

        fromEventFilterMap<InputEvent, CanvasMessage>({
          target: editorNode,
          type: "beforeinput",
          toMessage: (event) => {
            if (event.inputType !== "historyUndo" && event.inputType !== "historyRedo")
              return Option.none();
            if (keydownHandledUndo) {
              keydownHandledUndo = false;
              return Option.none();
            }
            event.preventDefault();
            commit();
            return Option.some(event.inputType === "historyUndo" ? UndidCanvas() : RedidCanvas());
          },
        }),

        fromEventFilterMap<FocusEvent, CanvasMessage>({
          target: editorNode,
          type: "blur",
          toMessage: () => {
            exitEditMode();
            return Option.none();
          },
        }),

        fromEventFilterMap<MouseEvent, CanvasMessage>({
          target: document,
          type: "click",
          options: { capture: true },
          toMessage: (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return Option.none();
            const button = target.closest<HTMLButtonElement>(
              '[aria-label="Undo"], [aria-label="Redo"]',
            );
            if (button === null) return Option.none();
            event.preventDefault();
            event.stopImmediatePropagation();
            commit();
            return Option.some(button.ariaLabel === "Undo" ? UndidCanvas() : RedidCanvas());
          },
        }),

        fromEventFilterMap<PointerEvent, CanvasMessage>({
          target: document,
          type: "pointerdown",
          options: { capture: true },
          toMessage: (event) => {
            outside(event);
            return Option.none();
          },
        }),
      ]).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            unregisterKeydown();
            unregisterHistory();
            unregisterBlockUndo();
            unregisterBlockRedo();
            unregisterUpdate();
            unregisterRichText();
            editor.setRootElement(null);
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
