import { Effect, Option, Stream } from "effect";
import { fromEventFilterMap } from "foldkit/subscription";
import type { CanvasElement } from "@dearly/domain";
import type { CanvasMessage } from "./message";
import {
  ClosedContextMenu,
  CutCanvasElement,
  FinishedCanvasTransform,
  MovedCanvasElement,
  OpenedContextMenu,
  PastedCanvasElement,
  PastedCanvasText,
  RequestedDelete,
  RequestedUpload,
  SelectedCanvasElement,
  StartedCanvasTransform,
  TransformedCanvasElement,
} from "./message";
import {
  CANVAS_ELEMENT_CLIPBOARD_TYPE,
  canvasElementToText,
  parseCanvasElement,
} from "./clipboard";

type Handle =
  | "north-west"
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west";
type Action = "drag" | "resize" | "rotate";
type Start = Pick<CanvasElement, "x" | "y" | "width" | "height" | "rotation"> & {
  readonly clientX: number;
  readonly clientY: number;
  readonly angle: number;
  readonly handle?: Handle;
};

const DRAG_THRESHOLD = 3;

const normalizedAngle = (angle: number) => ((angle + 540) % 360) - 180;

export const minimumCanvasSize = (element: CanvasElement) =>
  element.payload.kind === "sticker" ? 32 : 80;

const current = (
  node: Element,
): Pick<CanvasElement, "x" | "y" | "width" | "height" | "rotation"> => ({
  x: Number(node.getAttribute("data-canvas-x")),
  y: Number(node.getAttribute("data-canvas-y")),
  width: Number(node.getAttribute("data-canvas-width")),
  height: Number(node.getAttribute("data-canvas-height")),
  rotation: Number(node.getAttribute("data-canvas-rotation")),
});

const isEditable = (event: Event) =>
  event.target instanceof Element &&
  event.target.closest("input, textarea, [contenteditable=true]") !== null;

export const canvasClipboard = (node: HTMLElement): Stream.Stream<CanvasMessage> => {
  node.tabIndex = 0;

  return Stream.mergeAll({ concurrency: "unbounded" })([
    // Focus the canvas node on pointerdown (side-effect only)
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointerdown",
      toMessage: (event) => {
        const target = event.target;
        if (isEditable(event) || (target instanceof Element && target.closest("button")))
          return Option.none();
        node.focus({ preventScroll: true });
        return Option.none();
      },
    }),

    // Copy — write custom clipboard data, no Message dispatched
    fromEventFilterMap<ClipboardEvent, CanvasMessage>({
      target: document,
      type: "copy",
      toMessage: (event) => {
        if (isEditable(event)) return Option.none();
        const value = node.dataset.canvasSelection;
        if (value === undefined || event.clipboardData === null) return Option.none();
        event.preventDefault();
        event.clipboardData.setData(CANVAS_ELEMENT_CLIPBOARD_TYPE, value);
        const element = parseCanvasElement(value);
        if (element !== undefined) {
          const text = canvasElementToText(element);
          if (text !== "") event.clipboardData.setData("text/plain", text);
        }
        return Option.none();
      },
    }),

    // Cut — write custom clipboard data + dispatch cut message
    fromEventFilterMap<ClipboardEvent, CanvasMessage>({
      target: document,
      type: "cut",
      toMessage: (event) => {
        if (isEditable(event) || node.dataset.canvasSelection === undefined) return Option.none();
        event.preventDefault();
        const value = node.dataset.canvasSelection;
        event.clipboardData?.setData(CANVAS_ELEMENT_CLIPBOARD_TYPE, value);
        const element = parseCanvasElement(value);
        if (element !== undefined && event.clipboardData !== null) {
          const text = canvasElementToText(element);
          if (text !== "") event.clipboardData.setData("text/plain", text);
        }
        return Option.some(CutCanvasElement());
      },
    }),

    // Paste — handle canvas element, image, or text paste
    fromEventFilterMap<ClipboardEvent, CanvasMessage>({
      target: document,
      type: "paste",
      toMessage: (event) => {
        if (isEditable(event)) return Option.none();
        const clipboard = event.clipboardData;
        const element = parseCanvasElement(clipboard?.getData(CANVAS_ELEMENT_CLIPBOARD_TYPE) ?? "");
        if (element !== undefined) {
          event.preventDefault();
          return Option.some(PastedCanvasElement({ element }));
        }
        const image =
          [...(clipboard?.files ?? [])].find((file) => file.type.startsWith("image/")) ??
          [...(clipboard?.items ?? [])]
            .find((item) => item.type.startsWith("image/"))
            ?.getAsFile() ??
          undefined;
        if (image !== undefined) {
          event.preventDefault();
          return Option.some(RequestedUpload({ file: image, kind: "image" }));
        }
        const text = clipboard?.getData("text/plain").trim();
        if (text !== undefined && text !== "") {
          event.preventDefault();
          return Option.some(PastedCanvasText({ text }));
        }
        return Option.none();
      },
    }),

    // Delete/Backspace keyboard shortcut
    fromEventFilterMap<KeyboardEvent, CanvasMessage>({
      target: document,
      type: "keydown",
      toMessage: (event) => {
        if (isEditable(event) || (event.key !== "Backspace" && event.key !== "Delete"))
          return Option.none();
        if (!node.contains(document.activeElement)) return Option.none();
        event.preventDefault();
        return Option.some(RequestedDelete());
      },
    }),

    // Context menu — select the element first, then open the menu
    fromEventFilterMap<MouseEvent, CanvasMessage>({
      target: document,
      type: "contextmenu",
      toMessage: (event) => {
        if (isEditable(event)) return Option.none();
        event.preventDefault();
        const target = event.target;
        if (!(target instanceof Element)) return Option.none();
        const elementNode = target.closest("[data-canvas-element]");
        const elementId = elementNode?.getAttribute("data-canvas-id") ?? null;
        if (elementId !== null) {
          return Option.some(SelectedCanvasElement({ id: elementId }));
        }
        return Option.none();
      },
    }),
    fromEventFilterMap<MouseEvent, CanvasMessage>({
      target: document,
      type: "contextmenu",
      toMessage: (event) => {
        if (isEditable(event)) return Option.none();
        event.preventDefault();
        const target = event.target;
        if (!(target instanceof Element)) return Option.none();
        const elementNode = target.closest("[data-canvas-element]");
        const elementId = elementNode?.getAttribute("data-canvas-id") ?? null;
        return Option.some(OpenedContextMenu({ x: event.clientX, y: event.clientY, elementId }));
      },
    }),

    // Close context menu on outside click
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: document,
      type: "pointerdown",
      toMessage: (event) => {
        const target = event.target;
        if (
          !(target instanceof Element) ||
          target.closest("[data-canvas-element]") ||
          target.closest("[data-context-menu]") ||
          target.closest("[data-canvas-controls]") ||
          target.closest("[data-canvas-dialog]")
        )
          return Option.none();
        return Option.some(ClosedContextMenu());
      },
    }),
  ]);
};

export const canvasElement = (
  element: CanvasElement,
  node: Element,
): Stream.Stream<CanvasMessage> => {
  let action: Action | undefined;
  let pointerId: number | undefined;
  let start: Start | undefined;

  const releasePointerCapture = () => {
    if (pointerId !== undefined && node.hasPointerCapture(pointerId))
      node.releasePointerCapture(pointerId);
  };

  const resetState = () => {
    action = undefined;
    pointerId = undefined;
    start = undefined;
  };

  return Stream.mergeAll({ concurrency: "unbounded" })([
    // Select element on pointerdown
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointerdown",
      toMessage: (event) => {
        if (event.button !== 0) return Option.none();
        const target = event.target;
        if (!(target instanceof Element)) return Option.none();
        if (target.closest("[data-canvas-controls]")) return Option.none();
        const richText = target.closest("[data-rich-text-editor]");
        if (richText !== null && node.hasAttribute("data-editing")) return Option.none();
        const previousTextPointerDown = Number(node.getAttribute("data-text-pointer-down"));
        if (richText !== null && event.timeStamp - previousTextPointerDown < 400) {
          node.removeAttribute("data-text-pointer-down");
          node.dispatchEvent(new Event("canvas-text-edit"));
          return Option.none();
        }
        if (richText !== null) node.setAttribute("data-text-pointer-down", String(event.timeStamp));
        event.preventDefault();
        return Option.some(SelectedCanvasElement({ id: element.id }));
      },
    }),

    // Track interaction (drag, resize, rotate) — set up pointer capture
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointerdown",
      toMessage: (event) => {
        if (event.button !== 0) return Option.none();
        const target = event.target;
        if (!(target instanceof Element)) return Option.none();
        if (target.closest("[data-canvas-controls]")) return Option.none();
        const richText = target.closest("[data-rich-text-editor]");
        if (richText !== null && node.hasAttribute("data-editing")) return Option.none();
        const resize = (target
          .closest("[data-canvas-resize]")
          ?.getAttribute("data-canvas-resize") ?? null) as Handle | null;
        const immediate: Action | undefined =
          resize !== null
            ? "resize"
            : target.closest("[data-canvas-rotate]")
              ? "rotate"
              : undefined;
        if (immediate !== undefined) {
          const rect = node.getBoundingClientRect();
          action = immediate;
          pointerId = event.pointerId;
          start = {
            ...current(node),
            clientX: event.clientX,
            clientY: event.clientY,
            angle:
              Math.atan2(
                event.clientY - (rect.top + rect.height / 2),
                event.clientX - (rect.left + rect.width / 2),
              ) *
              (180 / Math.PI),
            ...(resize === null ? {} : { handle: resize }),
          };
          node.setPointerCapture(pointerId);
          return Option.some(StartedCanvasTransform());
        }
        // Body click: prepare for deferred drag
        pointerId = event.pointerId;
        start = {
          ...current(node),
          clientX: event.clientX,
          clientY: event.clientY,
          angle: 0,
        };
        node.setPointerCapture(pointerId);
        return Option.none();
      },
    }),

    // Pointer move — dispatch transform messages
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointermove",
      toMessage: (event) => {
        if (start === undefined || event.pointerId !== pointerId) return Option.none();
        // Start deferred drag once pointer moves past threshold
        if (action === undefined) {
          const dx = event.clientX - start.clientX;
          const dy = event.clientY - start.clientY;
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return Option.none();
          action = "drag";
          return Option.some(StartedCanvasTransform());
        }
        if (action === "drag") {
          const x = start.x + event.clientX - start.clientX;
          const y = start.y + event.clientY - start.clientY;
          node.setAttribute("data-canvas-x", String(x));
          node.setAttribute("data-canvas-y", String(y));
          return Option.some(MovedCanvasElement({ id: element.id, x, y }));
        }
        if (action === "rotate") {
          const rect = node.getBoundingClientRect();
          const angle =
            Math.atan2(
              event.clientY - (rect.top + rect.height / 2),
              event.clientX - (rect.left + rect.width / 2),
            ) *
            (180 / Math.PI);
          const rotation = start.rotation + normalizedAngle(angle - start.angle);
          node.setAttribute("data-canvas-rotation", String(rotation));
          return Option.some(
            TransformedCanvasElement({
              id: element.id,
              x: start.x,
              y: start.y,
              width: start.width,
              height: start.height,
              rotation,
            }),
          );
        }
        const dx = event.clientX - start.clientX;
        const dy = event.clientY - start.clientY;
        const handle = start.handle;
        if (handle === undefined) return Option.none();
        const left = handle.includes("west") ? start.x + dx : start.x;
        const top = handle.includes("north") ? start.y + dy : start.y;
        const minimumSize = minimumCanvasSize(element);
        const width = Math.max(
          minimumSize,
          start.width + (handle.includes("west") ? -dx : handle.includes("east") ? dx : 0),
        );
        const height = Math.max(
          minimumSize,
          start.height + (handle.includes("north") ? -dy : handle.includes("south") ? dy : 0),
        );
        const x =
          width === minimumSize && handle.includes("west")
            ? start.x + start.width - minimumSize
            : left;
        const y =
          height === minimumSize && handle.includes("north")
            ? start.y + start.height - minimumSize
            : top;
        node.setAttribute("data-canvas-x", String(x));
        node.setAttribute("data-canvas-y", String(y));
        node.setAttribute("data-canvas-width", String(width));
        node.setAttribute("data-canvas-height", String(height));
        return Option.some(
          TransformedCanvasElement({
            id: element.id,
            x,
            y,
            width,
            height,
            rotation: start.rotation,
          }),
        );
      },
    }),

    // Pointer up — finish transform
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointerup",
      toMessage: () => {
        releasePointerCapture();
        const msg = action !== undefined ? Option.some(FinishedCanvasTransform()) : Option.none();
        resetState();
        return msg;
      },
    }),

    // Pointer cancel — finish transform
    fromEventFilterMap<PointerEvent, CanvasMessage>({
      target: node,
      type: "pointercancel",
      toMessage: () => {
        releasePointerCapture();
        const msg = action !== undefined ? Option.some(FinishedCanvasTransform()) : Option.none();
        resetState();
        return msg;
      },
    }),
  ]).pipe(
    // Safety net: release capture if the element unmounts mid-interaction
    Stream.ensuring(
      Effect.sync(() => {
        releasePointerCapture();
        resetState();
      }),
    ),
  );
};
