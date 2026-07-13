import { Schema } from "effect";
import { Dialog } from "@foldkit/ui";
import { CanvasElement } from "@dearly/domain";

export const TextFormat = Schema.Struct({
  font: Schema.String,
  size: Schema.String,
  color: Schema.String,
  align: Schema.Literals(["left", "center", "right"]),
  bold: Schema.Boolean,
  italic: Schema.Boolean,
  underline: Schema.Boolean,
});
export type TextFormat = Schema.Schema.Type<typeof TextFormat>;

export const defaultTextFormat = (): TextFormat => ({
  font: "inherit",
  size: "24px",
  color: "var(--foreground)",
  align: "left",
  bold: false,
  italic: false,
  underline: false,
});

export const Model = Schema.Struct({
  elements: Schema.Array(CanvasElement),
  selectedElementId: Schema.NullOr(Schema.String),
  deleteDialog: Dialog.Model,
  resizing: Schema.NullOr(
    Schema.Struct({
      id: Schema.String,
      screenX: Schema.Number,
      screenY: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
    }),
  ),
  toolbarMenu: Schema.NullOr(Schema.Literals(["font", "size", "color"])),
  textFormat: TextFormat,
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (): Model => ({
  elements: [],
  selectedElementId: null,
  deleteDialog: Dialog.init({ id: "delete-canvas-element" }),
  resizing: null,
  toolbarMenu: null,
  textFormat: defaultTextFormat(),
});
