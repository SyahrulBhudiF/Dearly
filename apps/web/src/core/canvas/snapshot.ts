import { toCanvas } from "html-to-image";

const canvasSelector = "[data-entry-canvas]";

export const captureCanvasThumbnail = async (): Promise<File> => {
  const canvas = document.querySelector<HTMLElement>(canvasSelector);
  if (canvas === null) throw new Error("Canvas is not mounted");
  const rendered = await toCanvas(canvas, {
    backgroundColor: getComputedStyle(canvas).backgroundColor,
    filter: (node) => !(node instanceof Element) || !node.hasAttribute("data-canvas-controls"),
    pixelRatio: 1,
  });
  const blob = await new Promise<Blob | null>((resolve) => rendered.toBlob(resolve, "image/webp", 0.8));
  if (blob === null) throw new Error("Canvas snapshot failed");
  return new File([blob], "diary-canvas.webp", { type: "image/webp" });
};
