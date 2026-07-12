import { DragDropManager, Draggable, Droppable } from "@dnd-kit/dom";
import { Effect, Queue, Stream } from "effect";
import type { AppMessage } from "./message";
import { MovedCanvasElement } from "./message";

const manager = new DragDropManager();

export const canvasDropZone = (element: Element): Stream.Stream<AppMessage> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<AppMessage>(16);
      const dropZone = new Droppable({ id: "entry-canvas", element }, manager);
      const onDragEnd = (
        event: Parameters<typeof manager.monitor.addEventListener<"dragend">>[1] extends (
          event: infer Event,
          ...args: never[]
        ) => void
          ? Event
          : never,
      ) => {
        if (event.canceled || event.operation.source === null) return;
        Queue.offerUnsafe(
          messages,
          MovedCanvasElement({
            id: String(event.operation.source.id),
            x: Number(event.operation.source.data.x) + event.operation.transform.x,
            y: Number(event.operation.source.data.y) + event.operation.transform.y,
          }),
        );
      };
      manager.monitor.addEventListener("dragend", onDragEnd);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            manager.monitor.removeEventListener("dragend", onDragEnd);
            dropZone.destroy();
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );

export const canvasElement = (
  id: string,
  position: { readonly x: number; readonly y: number },
  element: Element,
): Stream.Stream<AppMessage> =>
  Stream.unwrap(
    Effect.sync(() => {
      const draggable = new Draggable({ id, element, data: position }, manager);
      return Stream.never.pipe(Stream.ensuring(Effect.sync(() => draggable.destroy())));
    }),
  );
