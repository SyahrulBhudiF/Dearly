import { Match } from "effect";
import { Dialog } from "@foldkit/ui";
import { Command } from "foldkit";
import type { MediaObjectId, Sticker } from "@dearly/domain";
import {
  changeLayer,
  moveElement,
  moveLayerToEdge,
  nextLayer,
  reorderLayers,
  resizeElement,
  setText,
  setTextDocument,
  textElement,
  transformSelectedElement,
} from "./elements";
import { GotDeleteDialogMessage, type CanvasMessage } from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<CanvasMessage>>];

const finishTransactions = (model: Model): Model => {
  const pointerTransaction = model.history.pointerTransaction;
  if (pointerTransaction === null || pointerTransaction === model.elements) return model;
  return {
    ...model,
    history: {
      ...model.history,
      past: [...model.history.past, pointerTransaction],
      future: [],
      pointerTransaction: null,
    },
  };
};

const undo = (input: Model): Model => {
  const model = finishTransactions(input);
  const elements = model.history.past.at(-1);
  if (elements === undefined) return model;
  return {
    ...model,
    elements,
    selectedElementId: null,
    toolbarMenu: null,
    history: {
      ...model.history,
      past: model.history.past.slice(0, -1),
      future: [...model.history.future, model.elements],
      revision: model.history.revision + 1,
    },
  };
};

const redo = (model: Model): Model => {
  const elements = model.history.future.at(-1);
  if (elements === undefined) return model;
  return {
    ...model,
    elements,
    selectedElementId: null,
    toolbarMenu: null,
    history: {
      ...model.history,
      past: [...model.history.past, model.elements],
      future: model.history.future.slice(0, -1),
      revision: model.history.revision + 1,
    },
  };
};

const record = (model: Model, next: Model): Model => {
  if (next.elements === model.elements || model.history.pointerTransaction !== null) return next;
  return {
    ...next,
    history: {
      ...model.history,
      past: [...model.history.past, model.elements],
      future: [],
    },
  };
};

export const update = (model: Model, message: CanvasMessage): UpdateResult => {
  if (message._tag === "UndidCanvas") return [undo(model), []];
  if (message._tag === "RedidCanvas") return [redo(model), []];
  if (message._tag === "StartedTextSession") {
    return [
      {
        ...model,
        history: {
          ...model.history,
          activeTextSession: { sessionId: message.sessionId, elementId: message.id },
        },
      },
      [],
    ];
  }
  if (message._tag === "CommittedTextSession") {
    const elements = setTextDocument(model.elements, message.id, message.document);
    const committed =
      elements === model.elements
        ? {
            ...model,
            history: { ...model.history, activeTextSession: null },
          }
        : {
            ...model,
            elements,
            history: {
              ...model.history,
              past: [...model.history.past, model.elements],
              future: [],
              activeTextSession: null,
            },
          };
    if (message.direction === "undo") return [undo(committed), []];
    if (message.direction === "redo")
      return [elements === model.elements ? redo(model) : committed, []];
    return [committed, []];
  }
  if (message._tag === "StartedCanvasTransform") {
    if (model.history.pointerTransaction !== null) return [model, []];
    return [
      {
        ...model,
        history: { ...model.history, pointerTransaction: model.elements },
      },
      [],
    ];
  }
  if (message._tag === "FinishedCanvasTransform") {
    const transaction = model.history.pointerTransaction;
    if (transaction === null) return [model, []];
    return [
      {
        ...model,
        history: {
          ...model.history,
          past:
            transaction === model.elements
              ? model.history.past
              : [...model.history.past, transaction],
          pointerTransaction: null,
          future: transaction === model.elements ? model.history.future : [],
        },
      },
      [],
    ];
  }
  const [next, commands] = updateDocument(model, message);
  return [record(model, next), commands];
};

const updateDocument = (model: Model, message: CanvasMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      StartedTextSession: (): UpdateResult => [model, []],
      CommittedTextSession: (): UpdateResult => [model, []],
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
      MovedCanvasElementLayer: ({ id, edge }): UpdateResult => [
        { ...model, elements: moveLayerToEdge(model.elements, id, edge) },
        [],
      ],
      ReorderedCanvasElements: ({ draggedId, targetId }): UpdateResult => [
        { ...model, elements: reorderLayers(model.elements, draggedId, targetId) },
        [],
      ],
      ToggledLayersPanel: (): UpdateResult => [
        { ...model, layersPanelOpen: !model.layersPanelOpen },
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
      StartedCanvasTransform: (): UpdateResult => [model, []],
      FinishedCanvasTransform: (): UpdateResult => [model, []],
      UndidCanvas: (): UpdateResult => [model, []],
      RedidCanvas: (): UpdateResult => [model, []],
    }),
  );

export const loadElements = (model: Model, elements: Model["elements"]): Model => ({
  ...model,
  elements: elements.length === 0 ? [textElement("")] : elements,
  selectedElementId: null,
  resizing: null,
  toolbarMenu: null,
  history: {
    past: [],
    future: [],
    pointerTransaction: null,
    activeTextSession: null,
    revision: 0,
  },
});

export const addImage = (model: Model, mediaObjectId: MediaObjectId, title = ""): Model =>
  record(model, {
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

export const addSticker = (model: Model, sticker: Sticker): Model =>
  record(model, {
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

export const addEmoji = (model: Model, emoji: string): Model =>
  record(model, {
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
