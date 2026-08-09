import { Option, Schema } from "effect";
import { CanvasElement } from "@dearly/domain";

export const CANVAS_ELEMENT_CLIPBOARD_TYPE = "application/x-dearly-canvas-elements+json";

const ClipboardPayload = Schema.Struct({ version: Schema.Literal(1), element: CanvasElement });

export const serializeCanvasElement = (element: CanvasElement) =>
  JSON.stringify({ version: 1, element });

export const parseCanvasElement = (value: string) => {
  try {
    return Option.getOrUndefined(Schema.decodeUnknownOption(ClipboardPayload)(JSON.parse(value)))
      ?.element;
  } catch {
    return undefined;
  }
};

// Human-readable clipboard payload so Ctrl+C yields copyable text outside Dearly.
const textOf = (node: unknown): string => {
  if (typeof node !== "object" || node === null) return "";
  const value = node as Record<string, unknown>;
  const text = typeof value.text === "string" ? value.text : "";
  const children = Array.isArray(value.children) ? value.children.map(textOf).join("") : "";
  return text + children;
};

export const canvasElementToText = (element: CanvasElement): string => {
  switch (element.payload.kind) {
    case "text":
      return textOf(element.payload.document.root);
    case "image":
      return element.payload.alt ?? "";
    case "sticker":
      return element.payload.emoji ?? "";
    case "shape":
      return element.payload.shape;
  }
};

export const writeClipboard = (serialized: string) => {
  const element = parseCanvasElement(serialized);
  const text = element === undefined ? serialized : canvasElementToText(element);
  navigator.clipboard
    .write([
      new ClipboardItem({
        [CANVAS_ELEMENT_CLIPBOARD_TYPE]: new Blob([serialized], {
          type: CANVAS_ELEMENT_CLIPBOARD_TYPE,
        }),
        ...(text === "" ? {} : { "text/plain": new Blob([text], { type: "text/plain" }) }),
      }),
    ])
    .catch(() => {
      // Fallback: write as plain text so paste-at-least-text works
      navigator.clipboard.writeText(text).catch(() => {});
    });
};
