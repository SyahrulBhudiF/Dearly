import { Effect, Queue, Stream } from "effect";
import { DragDropManager } from "@dnd-kit/dom";
import { isSortable, Sortable } from "@dnd-kit/dom/sortable";
import { resolveLayerDropTarget } from "./layerDrop";
import { ReorderedCanvasElements } from "./message";

export const sortableLayers = (root: Element) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<ReturnType<typeof ReorderedCanvasElements>>(1);
      const manager = new DragDropManager();
      const layerIds = [...root.querySelectorAll<HTMLElement>("[data-layer-id]")].map(
        (element) => element.dataset["layerId"]!,
      );
      const sortables = [...root.querySelectorAll<HTMLElement>("[data-layer-id]")].map(
        (element, index) => {
          const handle = element.querySelector<HTMLElement>("[data-layer-handle]");
          return new Sortable(
            {
              id: element.dataset["layerId"]!,
              index,
              element,
              ...(handle === null ? {} : { handle }),
              transition: { duration: 180, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
            },
            manager,
          );
        },
      );
      const stopEnd = manager.monitor.addEventListener("dragend", ({ operation, canceled }) => {
        const source = operation.source;
        if (canceled || !isSortable(source)) return;
        const targetId = resolveLayerDropTarget(
          layerIds,
          source.initialIndex,
          source.index,
          String(operation.target?.id ?? source.id),
        );
        if (targetId !== null) {
          Queue.offerUnsafe(
            messages,
            ReorderedCanvasElements({ draggedId: String(source.id), targetId }),
          );
        }
      });
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            stopEnd();
            sortables.forEach((sortable) => sortable.destroy());
            manager.destroy();
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
