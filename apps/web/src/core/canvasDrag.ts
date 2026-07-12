import { Effect, Queue, Stream } from "effect";
import type { CanvasElement } from "@dearly/domain";
import type { AppMessage } from "./message";
import { MovedCanvasElement, SelectedCanvasElement, TransformedCanvasElement } from "./message";

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

const normalizedAngle = (angle: number) => ((angle + 540) % 360) - 180;

const current = (
  node: Element,
): Pick<CanvasElement, "x" | "y" | "width" | "height" | "rotation"> => ({
  x: Number(node.getAttribute("data-canvas-x")),
  y: Number(node.getAttribute("data-canvas-y")),
  width: Number(node.getAttribute("data-canvas-width")),
  height: Number(node.getAttribute("data-canvas-height")),
  rotation: Number(node.getAttribute("data-canvas-rotation")),
});

export const canvasElement = (element: CanvasElement, node: Element): Stream.Stream<AppMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<AppMessage>(16);
      let action: Action | undefined;
      let pointerId: number | undefined;
      let start: Start | undefined;

      const end = () => {
        if (pointerId !== undefined && node.hasPointerCapture(pointerId))
          node.releasePointerCapture(pointerId);
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
        const width = Math.max(
          80,
          start.width + (handle.includes("west") ? -dx : handle.includes("east") ? dx : 0),
        );
        const height = Math.max(
          80,
          start.height + (handle.includes("north") ? -dy : handle.includes("south") ? dy : 0),
        );
        Queue.offerUnsafe(
          messages,
          TransformedCanvasElement({
            id: element.id,
            x: width === 80 && handle.includes("west") ? start.x + start.width - 80 : left,
            y: height === 80 && handle.includes("north") ? start.y + start.height - 80 : top,
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
        const resize = (target
          .closest("[data-canvas-resize]")
          ?.getAttribute("data-canvas-resize") ?? null) as Handle | null;
        const next: Action | undefined = target.closest("[data-canvas-grab]")
          ? "drag"
          : resize !== null
            ? "resize"
            : target.closest("[data-canvas-rotate]")
              ? "rotate"
              : undefined;
        if (next === undefined) {
          if (target.closest("[data-canvas-controls]") === null) {
            Queue.offerUnsafe(messages, SelectedCanvasElement({ id: element.id }));
          }
          return;
        }
        event.preventDefault();
        const rect = node.getBoundingClientRect();
        Queue.offerUnsafe(messages, SelectedCanvasElement({ id: element.id }));
        action = next;
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
