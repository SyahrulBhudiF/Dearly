import { Effect, Queue, Stream } from "effect";
import type { AppMessage } from "./message";
import { MovedCanvasElement } from "./message";

export const canvasDropZone = (_element: Element): Stream.Stream<AppMessage> => Stream.never;

export const canvasElement = (
  id: string,
  position: { readonly x: number; readonly y: number },
  element: Element,
): Stream.Stream<AppMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<AppMessage>(16);
      let start: { x: number; y: number; clientX: number; clientY: number } | undefined;

      const move = (event: Event) => {
        if (!(event instanceof PointerEvent) || start === undefined) return;
        Queue.offerUnsafe(
          messages,
          MovedCanvasElement({
            id,
            x: start.x + event.clientX - start.clientX,
            y: start.y + event.clientY - start.clientY,
          }),
        );
      };
      const end = () => {
        start = undefined;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
      };
      const startDrag = (event: Event) => {
        if (!(event instanceof PointerEvent) || event.button !== 0) return;
        const target = event.target;
        if (
          !(target instanceof Element) ||
          target.closest("[data-canvas-editable], [data-canvas-controls], button") !== null
        )
          return;
        start = { ...position, clientX: event.clientX, clientY: event.clientY };
        element.setPointerCapture(event.pointerId);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end, { once: true });
      };

      element.addEventListener("pointerdown", startDrag);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            end();
            element.removeEventListener("pointerdown", startDrag);
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
