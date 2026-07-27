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
