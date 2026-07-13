import { Schema } from "effect";
import { Dialog } from "@foldkit/ui";
import { RichTextDocument } from "@dearly/domain";
import { Message } from "foldkit";
import { TextFormat } from "./model";

export const ChangedText = Message.m("ChangedText", { id: Schema.String, text: Schema.String });
export const ChangedTextDocument = Message.m("ChangedTextDocument", {
  id: Schema.String,
  document: RichTextDocument,
});
export const ChangedImageTitle = Message.m("ChangedImageTitle", {
  id: Schema.String,
  title: Schema.String,
});
export const AddedTextCanvasElement = Message.m("AddedTextCanvasElement");
export const PastedCanvasText = Message.m("PastedCanvasText", { text: Schema.String });
export const RequestedUpload = Message.m("CanvasRequestedUpload", {
  file: Schema.Any,
  kind: Schema.Literal("image"),
});
export const SelectedCanvasElement = Message.m("SelectedCanvasElement", { id: Schema.String });
export const DeselectedCanvasElement = Message.m("DeselectedCanvasElement");
export const TransformedCanvasElement = Message.m("TransformedCanvasElement", {
  id: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
  rotation: Schema.Number,
});
export const RequestedDelete = Message.m("RequestedDelete");
export const DeletedCanvasElement = Message.m("DeletedCanvasElement");
export const RotatedCanvasElement = Message.m("RotatedCanvasElement", { degrees: Schema.Number });
export const ChangedCanvasElementLayer = Message.m("ChangedCanvasElementLayer", {
  direction: Schema.Literals(["forward", "backward"]),
});
export const GotDeleteDialogMessage = Message.m("GotDeleteDialogMessage", {
  message: Dialog.Message,
});
export const MovedCanvasElement = Message.m("MovedCanvasElement", {
  id: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
});
export const StartedResize = Message.m("StartedResize", {
  id: Schema.String,
  screenX: Schema.Number,
  screenY: Schema.Number,
  width: Schema.Number,
  height: Schema.Number,
});
export const ResizedCanvasElement = Message.m("ResizedCanvasElement", {
  screenX: Schema.Number,
  screenY: Schema.Number,
});
export const FinishedResize = Message.m("FinishedResize");
export const ToggledToolbarMenu = Message.m("ToggledToolbarMenu", {
  menu: Schema.Literals(["font", "size", "color"]),
});
export const ClosedToolbarMenu = Message.m("ClosedToolbarMenu");
export const ChangedTextFormat = Message.m("ChangedTextFormat", { format: TextFormat });

export const CanvasMessage = Schema.Union([
  ChangedText,
  ChangedTextDocument,
  ChangedImageTitle,
  AddedTextCanvasElement,
  PastedCanvasText,
  RequestedUpload,
  SelectedCanvasElement,
  DeselectedCanvasElement,
  TransformedCanvasElement,
  RequestedDelete,
  DeletedCanvasElement,
  RotatedCanvasElement,
  ChangedCanvasElementLayer,
  GotDeleteDialogMessage,
  MovedCanvasElement,
  StartedResize,
  ResizedCanvasElement,
  FinishedResize,
  ToggledToolbarMenu,
  ClosedToolbarMenu,
  ChangedTextFormat,
]);
export type CanvasMessage = Schema.Schema.Type<typeof CanvasMessage>;
