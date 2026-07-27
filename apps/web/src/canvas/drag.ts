import { Effect, Queue, Stream } from "effect";
import type { CanvasElement } from "@dearly/domain";
import type { CanvasMessage } from "./message";
import {
  FinishedCanvasTransform,
  MovedCanvasElement,
  PastedCanvasElement,
  PastedCanvasText,
  RequestedCut,
  RequestedDelete,
  RequestedUpload,
  SelectedCanvasElement,
  StartedCanvasTransform,
  TransformedCanvasElement,
} from "./message";
import { CANVAS_ELEMENT_CLIPBOARD_TYPE, parseCanvasElement } from "./clipboard";

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

export const canvasClipboard = (node: HTMLElement): Stream.Stream<CanvasMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<CanvasMessage>(16);
      const isEditable = (event: Event) =>
        event.target instanceof Element &&
        event.target.closest("input, textarea, [contenteditable=true]") !== null;
      const focus = (event: PointerEvent) => {
        const target = event.target;
        if (isEditable(event) || (target instanceof Element && target.closest("button"))) return;
        node.focus({ preventScroll: true });
      };
      const copy = (event: ClipboardEvent) => {
        if (isEditable(event)) return;
        const value = node.dataset.canvasSelection;
        if (value === undefined || event.clipboardData === null) return;
        event.preventDefault();
        event.clipboardData.setData(CANVAS_ELEMENT_CLIPBOARD_TYPE, value);
      };
      const cut = (event: ClipboardEvent) => {
        if (isEditable(event) || node.dataset.canvasSelection === undefined) return;
        copy(event);
        if (event.defaultPrevented) Queue.offerUnsafe(messages, RequestedCut());
      };
      const keydown = (event: KeyboardEvent) => {
        if (isEditable(event) || (event.key !== "Backspace" && event.key !== "Delete")) return;
        event.preventDefault();
        Queue.offerUnsafe(messages, RequestedDelete());
      };
      const paste = (event: ClipboardEvent) => {
        if (isEditable(event)) return;
        const clipboard = event.clipboardData;
        const element = parseCanvasElement(clipboard?.getData(CANVAS_ELEMENT_CLIPBOARD_TYPE) ?? "");
        if (element !== undefined) {
          event.preventDefault();
          Queue.offerUnsafe(messages, PastedCanvasElement({ element }));
          return;
        }
        const image =
          [...(clipboard?.files ?? [])].find((file) => file.type.startsWith("image/")) ??
          [...(clipboard?.items ?? [])]
            .find((item) => item.type.startsWith("image/"))
            ?.getAsFile() ??
          undefined;
        if (image !== undefined) {
          event.preventDefault();
          Queue.offerUnsafe(messages, RequestedUpload({ file: image, kind: "image" }));
          return;
        }
        const text = clipboard?.getData("text/plain").trim();
        if (text !== undefined && text !== "") {
          event.preventDefault();
          Queue.offerUnsafe(messages, PastedCanvasText({ text }));
        }
      };
      node.tabIndex = 0;
      node.addEventListener("pointerdown", focus);
      node.addEventListener("copy", copy);
      node.addEventListener("cut", cut);
      node.addEventListener("paste", paste);
      node.addEventListener("keydown", keydown);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            node.removeEventListener("pointerdown", focus);
            node.removeEventListener("copy", copy);
            node.removeEventListener("cut", cut);
            node.removeEventListener("paste", paste);
            node.removeEventListener("keydown", keydown);
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );

export const canvasElement = (
  element: CanvasElement,
  node: Element,
): Stream.Stream<CanvasMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<CanvasMessage>(16);
      let action: Action | undefined;
      let pointerId: number | undefined;
      let start: Start | undefined;

      const end = () => {
        if (pointerId !== undefined && node.hasPointerCapture(pointerId))
          node.releasePointerCapture(pointerId);
        if (action !== undefined) Queue.offerUnsafe(messages, FinishedCanvasTransform());
        action = undefined;
        pointerId = undefined;
        start = undefined;
      };
      const move = (event: Event) => {
        if (
          !(event instanceof PointerEvent) ||
          start === undefined ||
          event.pointerId !== pointerId
        )
          return;
        // Start deferred drag once pointer moves past threshold
        if (action === undefined) {
          const dx = event.clientX - start.clientX;
          const dy = event.clientY - start.clientY;
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
          action = "drag";
          Queue.offerUnsafe(messages, StartedCanvasTransform());
        }
        if (action === "drag") {
          Queue.offerUnsafe(
            messages,
            MovedCanvasElement({
              id: element.id,
              x: start.x + event.clientX - start.clientX,
              y: start.y + event.clientY - start.clientY,
            }),
          );
          return;
        }
        if (action === "rotate") {
          const rect = node.getBoundingClientRect();
          const angle =
            Math.atan2(
              event.clientY - (rect.top + rect.height / 2),
              event.clientX - (rect.left + rect.width / 2),
            ) *
            (180 / Math.PI);
          Queue.offerUnsafe(
            messages,
            TransformedCanvasElement({
              id: element.id,
              x: start.x,
              y: start.y,
              width: start.width,
              height: start.height,
              rotation: start.rotation + normalizedAngle(angle - start.angle),
            }),
          );
          return;
        }
        const dx = event.clientX - start.clientX;
        const dy = event.clientY - start.clientY;
        const handle = start.handle;
        if (handle === undefined) return;
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
        Queue.offerUnsafe(
          messages,
          TransformedCanvasElement({
            id: element.id,
            x:
              width === minimumSize && handle.includes("west")
                ? start.x + start.width - minimumSize
                : left,
            y:
              height === minimumSize && handle.includes("north")
                ? start.y + start.height - minimumSize
                : top,
            width,
            height,
            rotation: start.rotation,
          }),
        );
      };
      const begin = (event: Event) => {
        if (!(event instanceof PointerEvent) || event.button !== 0) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest("[data-canvas-controls]")) return;
        const richText = target.closest("[data-rich-text-editor]");
        if (richText !== null && node.hasAttribute("data-editing")) return;
        const previousTextPointerDown = Number(node.getAttribute("data-text-pointer-down"));
        if (richText !== null && event.timeStamp - previousTextPointerDown < 400) {
          node.removeAttribute("data-text-pointer-down");
          node.dispatchEvent(new Event("canvas-text-edit"));
          return;
        }
        if (richText !== null) node.setAttribute("data-text-pointer-down", String(event.timeStamp));
        const resize = (target
          .closest("[data-canvas-resize]")
          ?.getAttribute("data-canvas-resize") ?? null) as Handle | null;
        const immediate: Action | undefined =
          resize !== null
            ? "resize"
            : target.closest("[data-canvas-rotate]")
              ? "rotate"
              : undefined;
        event.preventDefault();
        Queue.offerUnsafe(messages, SelectedCanvasElement({ id: element.id }));
        if (immediate !== undefined) {
          const rect = node.getBoundingClientRect();
          Queue.offerUnsafe(messages, StartedCanvasTransform());
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
          return;
        }
        // Body click: select + prepare for deferred drag
        pointerId = event.pointerId;
        start = {
          ...current(node),
          clientX: event.clientX,
          clientY: event.clientY,
          angle: 0,
        };
        node.setPointerCapture(pointerId);
      };

      node.addEventListener("pointerdown", begin);
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", end);
      node.addEventListener("pointercancel", end);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            end();
            node.removeEventListener("pointerdown", begin);
            node.removeEventListener("pointermove", move);
            node.removeEventListener("pointerup", end);
            node.removeEventListener("pointercancel", end);
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
