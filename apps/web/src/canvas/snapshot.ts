import { Effect } from "effect";
import { SnapshotError } from "@dearly/domain";
import { toCanvas } from "html-to-image";

const canvasSelector = "[data-entry-canvas]";

export const captureCanvasThumbnail = Effect.gen(function* () {
  const canvas = document.querySelector<HTMLElement>(canvasSelector);
  if (canvas === null) {
    return yield* Effect.fail(new SnapshotError({ message: "Canvas is not mounted" }));
  }

  const rendered = yield* Effect.promise(() =>
    toCanvas(canvas, {
      backgroundColor: getComputedStyle(canvas).backgroundColor,
      filter: (node) => !(node instanceof Element) || !node.hasAttribute("data-canvas-controls"),
      pixelRatio: 1,
    }),
  );

  const blob = yield* Effect.promise(
    () =>
      new Promise<Blob | null>((resolve) => rendered.toBlob(resolve, "image/webp", 0.8)),
  );

  if (blob === null) {
    return yield* Effect.fail(new SnapshotError({ message: "Canvas snapshot failed" }));
  }

  return new File([blob], "diary-canvas.webp", { type: "image/webp" });
});
