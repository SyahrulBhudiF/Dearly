import { Match } from "effect";
import { Dialog } from "@foldkit/ui";
import { Command } from "foldkit";
import type { MediaObjectId, Sticker } from "@dearly/domain";
import {
  changeLayer,
  moveElement,
  nextLayer,
  resizeElement,
  setText,
  setTextDocument,
  textElement,
  transformSelectedElement,
} from "./elements";
import { GotDeleteDialogMessage, type CanvasMessage } from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<CanvasMessage>>];

export const update = (model: Model, message: CanvasMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      ChangedTextDocument: ({ id, document }): UpdateResult => [
        { ...model, elements: setTextDocument(model.elements, id, document) },
        [],
      ],
      ChangedText: ({ id, text }): UpdateResult => [
        { ...model, elements: setText(model.elements, id, text) },
        [],
      ],
      ChangedImageTitle: ({ id, title }): UpdateResult => [
        {
          ...model,
          elements: model.elements.map((element) =>
            element.id === id && element.payload.kind === "image"
              ? { ...element, payload: { ...element.payload, alt: title } }
              : element,
          ),
        },
        [],
      ],
      AddedTextCanvasElement: (): UpdateResult => addText(model, ""),
      PastedCanvasText: ({ text }): UpdateResult => addText(model, text),
      CanvasRequestedUpload: (): UpdateResult => [model, []],
      SelectedCanvasElement: ({ id }): UpdateResult => [
        { ...model, selectedElementId: id, toolbarMenu: null },
        [],
      ],
      DeselectedCanvasElement: (): UpdateResult => [
        { ...model, selectedElementId: null, toolbarMenu: null },
        [],
      ],
      TransformedCanvasElement: ({ id, x, y, width, height, rotation }): UpdateResult => [
        {
          ...model,
          elements: model.elements.map((element) =>
            element.id === id ? { ...element, x, y, width, height, rotation } : element,
          ),
        },
        [],
      ],
      RequestedDelete: (): UpdateResult => {
        if (model.selectedElementId === null) return [model, []];
        const [deleteDialog, commands] = Dialog.open(model.deleteDialog);
        return [
          { ...model, deleteDialog },
          Command.mapMessages(commands, (message) => GotDeleteDialogMessage({ message })),
        ];
      },
      GotDeleteDialogMessage: ({ message }): UpdateResult => {
        const [deleteDialog, commands] = Dialog.update(model.deleteDialog, message);
        return [
          { ...model, deleteDialog },
          Command.mapMessages(commands, (child) => GotDeleteDialogMessage({ message: child })),
        ];
      },
      DeletedCanvasElement: (): UpdateResult => {
        if (model.selectedElementId === null) return [model, []];
        const [deleteDialog, commands] = Dialog.close(model.deleteDialog);
        return [
          {
            ...model,
            elements: model.elements.filter((element) => element.id !== model.selectedElementId),
            selectedElementId: null,
            deleteDialog,
            toolbarMenu: null,
          },
          Command.mapMessages(commands, (message) => GotDeleteDialogMessage({ message })),
        ];
      },
      RotatedCanvasElement: ({ degrees }): UpdateResult => [
        {
          ...model,
          elements: transformSelectedElement(
            model.elements,
            model.selectedElementId,
            (element) => ({
              ...element,
              rotation: (element.rotation + degrees) % 360,
            }),
          ),
        },
        [],
      ],
      ChangedCanvasElementLayer: ({ direction }): UpdateResult => [
        { ...model, elements: changeLayer(model.elements, model.selectedElementId, direction) },
        [],
      ],
      MovedCanvasElement: ({ id, x, y }): UpdateResult => [
        { ...model, elements: moveElement(model.elements, id, { x, y }) },
        [],
      ],
      StartedResize: ({ id, screenX, screenY, width, height }): UpdateResult => [
        { ...model, resizing: { id, screenX, screenY, width, height } },
        [],
      ],
      ResizedCanvasElement: ({ screenX, screenY }): UpdateResult => {
        if (model.resizing === null) return [model, []];
        return [
          {
            ...model,
            elements: resizeElement(model.elements, model.resizing.id, {
              width: Math.max(80, model.resizing.width + screenX - model.resizing.screenX),
              height: Math.max(80, model.resizing.height + screenY - model.resizing.screenY),
            }),
          },
          [],
        ];
      },
      FinishedResize: (): UpdateResult => [{ ...model, resizing: null }, []],
      ToggledToolbarMenu: ({ menu }): UpdateResult => [
        { ...model, toolbarMenu: model.toolbarMenu === menu ? null : menu },
        [],
      ],
      ClosedToolbarMenu: (): UpdateResult => [{ ...model, toolbarMenu: null }, []],
      ChangedTextFormat: ({ format }): UpdateResult => [{ ...model, textFormat: format }, []],
      ToggledShapePicker: (): UpdateResult => [
        { ...model, shapePickerOpen: !model.shapePickerOpen },
        [],
      ],
      ChangedShapeColor: ({ color }): UpdateResult => [{ ...model, shapeColor: color }, []],
      AddedShape: ({ shape }): UpdateResult => addShape(model, shape),
    }),
  );

export const loadElements = (model: Model, elements: Model["elements"]): Model => ({
  ...model,
  elements: elements.length === 0 ? [textElement("")] : elements,
  selectedElementId: null,
  resizing: null,
  toolbarMenu: null,
});

export const addImage = (model: Model, mediaObjectId: MediaObjectId, title = ""): Model => ({
  ...model,
  elements: [
    ...model.elements,
    {
      id: crypto.randomUUID() as never,
      payload: { kind: "image", mediaObjectId, ...(title === "" ? {} : { alt: title }) },
      x: 80,
      y: 80,
      width: 480,
      height: 320,
      rotation: 0,
      layer: nextLayer(model.elements),
    },
  ],
  selectedElementId: null,
});

export const addSticker = (model: Model, sticker: Sticker): Model => ({
  ...model,
  elements: [
    ...model.elements,
    {
      id: crypto.randomUUID() as never,
      payload: { kind: "sticker", stickerId: sticker.id, mediaObjectId: sticker.mediaObjectId },
      x: 620,
      y: 100,
      width: 160,
      height: 160,
      rotation: 0,
      layer: nextLayer(model.elements),
    },
  ],
  selectedElementId: null,
});

export const addEmoji = (model: Model, emoji: string): Model => ({
  ...model,
  elements: [
    ...model.elements,
    {
      id: crypto.randomUUID() as never,
      payload: {
        kind: "sticker",
        stickerId: crypto.randomUUID() as never,
        mediaObjectId: crypto.randomUUID() as never,
        emoji,
      },
      x: 620,
      y: 100,
      width: 160,
      height: 160,
      rotation: 0,
      layer: nextLayer(model.elements),
    },
  ],
  selectedElementId: null,
});

const addShape = (
  model: Model,
  shape: Extract<Model["elements"][number]["payload"], { kind: "shape" }>["shape"],
): UpdateResult => {
  const id = crypto.randomUUID() as never;
  return [
    {
      ...model,
      elements: [
        ...model.elements,
        {
          id,
          payload: { kind: "shape", shape, color: model.shapeColor },
          x: 220,
          y: 180,
          width: 180,
          height: 180,
          rotation: 0,
          layer: nextLayer(model.elements),
        },
      ],
      selectedElementId: id,
      shapePickerOpen: false,
    },
    [],
  ];
};

const addText = (model: Model, text: string): UpdateResult => {
  const element = textElement(text);
  return [
    {
      ...model,
      elements: [...model.elements, { ...element, layer: nextLayer(model.elements) }],
      selectedElementId: element.id,
    },
    [],
  ];
};
