import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import { ClipboardWritten } from "./message";
import { CANVAS_ELEMENT_CLIPBOARD_TYPE } from "./clipboard";

export const WriteClipboard = Command.define(
  "WriteClipboard",
  { serialized: Schema.String },
  ClipboardWritten,
)(({ serialized }) =>
  Effect.sync(() => {
    navigator.clipboard
      .write([
        new ClipboardItem({
          [CANVAS_ELEMENT_CLIPBOARD_TYPE]: new Blob([serialized], {
            type: CANVAS_ELEMENT_CLIPBOARD_TYPE,
          }),
        }),
      ])
      .catch(() => {});
    return ClipboardWritten();
  }),
);
