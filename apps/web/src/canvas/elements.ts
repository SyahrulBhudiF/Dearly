import type { CanvasElement, RichTextDocument } from "@dearly/domain";

export const moveElement = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  position: { readonly x: number; readonly y: number },
) => elements.map((element) => (element.id === id ? { ...element, ...position } : element));

export const resizeElement = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  size: { readonly width: number; readonly height: number },
) => elements.map((element) => (element.id === id ? { ...element, ...size } : element));

export const transformSelectedElement = (
  elements: ReadonlyArray<CanvasElement>,
  selectedElementId: string | null,
  transform: (element: CanvasElement) => CanvasElement,
) =>
  selectedElementId === null
    ? elements
    : elements.map((element) => (element.id === selectedElementId ? transform(element) : element));

export const changeLayer = (
  elements: ReadonlyArray<CanvasElement>,
  selectedElementId: string | null,
  direction: "forward" | "backward",
) => {
  if (selectedElementId === null) return elements;
  const ordered = [...elements].sort((a, b) => a.layer - b.layer);
  const index = ordered.findIndex((element) => element.id === selectedElementId);
  const target = direction === "forward" ? index + 1 : index - 1;
  if (index < 0 || target < 0 || target >= ordered.length) return elements;
  return reorderLayers(elements, ordered[index]!.id, ordered[target]!.id);
};

export const reorderLayers = (
  elements: ReadonlyArray<CanvasElement>,
  draggedId: string,
  targetId: string,
) => {
  const ordered = [...elements].sort((a, b) => a.layer - b.layer);
  const from = ordered.findIndex((element) => element.id === draggedId);
  const to = ordered.findIndex((element) => element.id === targetId);
  if (from < 0 || to < 0 || from === to) return elements;
  const [dragged] = ordered.splice(from, 1);
  if (dragged === undefined) return elements;
  ordered.splice(to, 0, dragged);
  const layers = new Map(ordered.map((element, layer) => [element.id, layer]));
  return elements.map((element) => ({ ...element, layer: layers.get(element.id)! }));
};

export const moveLayerToEdge = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  edge: "front" | "back",
) => {
  const ordered = [...elements].sort((a, b) => a.layer - b.layer);
  const target = edge === "front" ? ordered.at(-1) : ordered[0];
  return target === undefined ? elements : reorderLayers(elements, id, target.id);
};

export const textElement = (text: string): CanvasElement => ({
  id: crypto.randomUUID() as never,
  payload: textPayload(text),
  x: 80,
  y: 440,
  width: 720,
  height: 240,
  rotation: 0,
  layer: 0,
});

export const setText = (elements: ReadonlyArray<CanvasElement>, id: string, text: string) =>
  elements.map((element) =>
    element.id === id && element.payload.kind === "text"
      ? { ...element, payload: textPayload(text) }
      : element,
  );

export const setTextDocument = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  document: RichTextDocument,
) => {
  const element = elements.find((candidate) => candidate.id === id);
  if (
    element?.payload.kind !== "text" ||
    JSON.stringify(element.payload.document) === JSON.stringify(document)
  )
    return elements;
  return elements.map((candidate) =>
    candidate.id === id ? { ...candidate, payload: { ...candidate.payload, document } } : candidate,
  );
};

export const nextLayer = (elements: ReadonlyArray<CanvasElement>) =>
  elements.reduce((layer, element) => Math.max(layer, element.layer), -1) + 1;

const textPayload = (text: string) => ({
  kind: "text" as const,
  document: {
    type: "doc" as const,
    content:
      text === ""
        ? [{ type: "paragraph" }]
        : [{ type: "paragraph", content: [{ type: "text", text }] }],
  },
});
