import { Schema } from "effect";
import { Dialog } from "@foldkit/ui";
import { RichTextDocument, ShapeKind } from "@dearly/domain";
import { Message } from "foldkit";
import { TextFormat } from "./model";

export const ChangedText = Message.m("ChangedText", { id: Schema.String, text: Schema.String });
export const StartedTextSession = Message.m("StartedTextSession", {
  id: Schema.String,
  sessionId: Schema.String,
  document: RichTextDocument,
});
export const CommittedTextSession = Message.m("CommittedTextSession", {
  id: Schema.String,
  sessionId: Schema.String,
  document: RichTextDocument,
});
export const UpdatedTextDocument = Message.m("UpdatedTextDocument", {
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
export const StartedCanvasTransform = Message.m("StartedCanvasTransform");
export const FinishedCanvasTransform = Message.m("FinishedCanvasTransform");
export const UndidCanvas = Message.m("UndidCanvas");
export const RedidCanvas = Message.m("RedidCanvas");
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
export const MovedCanvasElementLayer = Message.m("MovedCanvasElementLayer", {
  id: Schema.String,
  edge: Schema.Literals(["front", "back"]),
});
export const ReorderedCanvasElements = Message.m("ReorderedCanvasElements", {
  draggedId: Schema.String,
  targetId: Schema.String,
});
export const ToggledLayersPanel = Message.m("ToggledLayersPanel");
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
export const ToggledShapePicker = Message.m("ToggledShapePicker");
export const ChangedShapeColor = Message.m("ChangedShapeColor", { color: Schema.String });
export const AddedShape = Message.m("AddedShape", { shape: ShapeKind });

export const CanvasMessage = Schema.Union([
  UpdatedTextDocument,
  ChangedText,
  StartedTextSession,
  CommittedTextSession,
  ChangedImageTitle,
  AddedTextCanvasElement,
  PastedCanvasText,
  RequestedUpload,
  SelectedCanvasElement,
  DeselectedCanvasElement,
  StartedCanvasTransform,
  FinishedCanvasTransform,
  UndidCanvas,
  RedidCanvas,
  TransformedCanvasElement,
  RequestedDelete,
  DeletedCanvasElement,
  RotatedCanvasElement,
  ChangedCanvasElementLayer,
  MovedCanvasElementLayer,
  ReorderedCanvasElements,
  ToggledLayersPanel,
  GotDeleteDialogMessage,
  MovedCanvasElement,
  StartedResize,
  ResizedCanvasElement,
  FinishedResize,
  ToggledToolbarMenu,
  ClosedToolbarMenu,
  ChangedTextFormat,
  ToggledShapePicker,
  ChangedShapeColor,
  AddedShape,
]);
export type CanvasMessage = Schema.Schema.Type<typeof CanvasMessage>;
