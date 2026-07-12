import type { CanvasElement } from "@dearly/domain";

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
  const selected = elements.find((element) => element.id === selectedElementId);
  if (selected === undefined) return elements;
  const adjacent = elements
    .filter((element) =>
      direction === "forward" ? element.layer > selected.layer : element.layer < selected.layer,
    )
    .sort((a, b) => (direction === "forward" ? a.layer - b.layer : b.layer - a.layer))[0];
  if (adjacent === undefined) return elements;
  return elements.map((element) => {
    if (element.id === selected.id) return { ...element, layer: adjacent.layer };
    if (element.id === adjacent.id) return { ...element, layer: selected.layer };
    return element;
  });
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

export const setText = (elements: ReadonlyArray<CanvasElement>, text: string) => {
  const existing = elements.find((element) => element.payload.kind === "text");
  return existing === undefined
    ? [...elements, { ...textElement(text), layer: nextLayer(elements) }]
    : elements.map((element) =>
        element.id === existing.id ? { ...element, payload: textPayload(text) } : element,
      );
};

export const nextLayer = (elements: ReadonlyArray<CanvasElement>) =>
  elements.reduce((layer, element) => Math.max(layer, element.layer), -1) + 1;

const textPayload = (text: string) => ({
  kind: "text" as const,
  document: {
    type: "doc" as const,
    content: text === "" ? [] : [{ type: "paragraph", content: [{ type: "text", text }] }],
  },
});
