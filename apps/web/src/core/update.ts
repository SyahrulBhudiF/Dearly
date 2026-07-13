import { Effect, Match, Option } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import type { DiaryEntry } from "@dearly/domain";
import { Command } from "foldkit";
import {
  loadDraft,
  loadEntries,
  loadEntry,
  loadImages,
  loadSession,
  loadStickers,
  removeDraft,
  saveEntry,
  storeDraft,
  uploadImage,
  uploadSticker,
} from "./command";
import {
  ChangedRoute,
  GotDeleteDialogMessage,
  GotUploadDialogMessage,
  RequestedUpload,
  GotEmojiListMessage,
  GotImagePopoverMessage,
  GotStickerPopoverMessage,
  type AppMessage,
} from "./message";
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
import type { Model } from "./model";
import { EntryRoute } from "./route";
import { today } from "../libs/date";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<AppMessage>>];

export const init = (model: Model): UpdateResult => [
  { ...model, loadState: "loading" },
  [
    loadSession(),
    loadEntries({ month: model.month }),
    loadStickers(),
    loadImages(),
    ...(model.route._tag === "EntryRoute"
      ? [loadEntry({ date: model.selectedDate }), loadDraft({ date: model.selectedDate })]
      : []),
  ],
];

export const update = (model: Model, message: AppMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      ChangedRoute: ({ route }): UpdateResult => {
        if (route._tag !== "EntryRoute") {
          return [{ ...model, route }, []];
        }
        const selectedDate = route.date;
        const month = selectedDate.slice(0, 7);
        return [
          {
            ...model,
            route,
            selectedDate,
            month,
            entryText: "",
            savedText: "",
            localDraft: null,
            elements: [],
            selectedElementId: null,
            deleteDialog: Dialog.init({ id: "delete-canvas-element" }),
            uploadDialog: Dialog.init({ id: "upload-title" }),
            pendingUpload: null,
            resizing: null,
            stickerPopover: Popover.init({ id: "sticker-picker" }),
            stickerFileDrop: FileDrop.init({ id: "sticker-media" }),
            imagePopover: Popover.init({ id: "image-picker" }),
            fileDrop: FileDrop.init({ id: "entry-media" }),
            uploadState: "idle",
            saveState: "idle",
          },
          [
            loadEntries({ month }),
            loadEntry({ date: selectedDate }),
            loadDraft({ date: selectedDate }),
          ],
        ];
      },
      SelectedDate: ({ date }): UpdateResult =>
        update(model, ChangedRoute({ route: EntryRoute({ date: date as never }) })),
      PreviewedDate: ({ date }): UpdateResult => [{ ...model, selectedDate: date }, []],
      ToggledPicker: (): UpdateResult => [
        {
          ...model,
          miniCalendarPickerOpen: !model.miniCalendarPickerOpen,
          miniCalendarPickerYear: Number(model.month.slice(0, 4)),
        },
        [],
      ],
      ClosedPicker: (): UpdateResult => [{ ...model, miniCalendarPickerOpen: false }, []],
      PickedYear: ({ year }): UpdateResult => [{ ...model, miniCalendarPickerYear: year }, []],
      ChangedMonth: ({ month }): UpdateResult => [
        { ...model, month, loadState: "loading", miniCalendarPickerOpen: false },
        [loadEntries({ month })],
      ],
      WentToday: (): UpdateResult => {
        const date = today();
        const month = date.slice(0, 7);
        return [
          { ...model, selectedDate: date, month, loadState: "loading" },
          [loadEntries({ month })],
        ];
      },
      LoadedSession: ({ session }): UpdateResult => [{ ...model, session }, []],
      LoadedEntries: ({ entries }): UpdateResult => [{ ...model, entries, loadState: "idle" }, []],
      LoadedEntry: ({ entry }): UpdateResult => {
        const savedText = entry === null ? "" : entryText(entry);
        return [
          {
            ...model,
            savedText,
            entryText: model.localDraft ?? savedText,
            elements:
              entry === null || entry.document.elements.length === 0
                ? [textElement("")]
                : entry.document.elements,
            selectedElementId: null,
            resizing: null,
            saveState: "idle",
          },
          [],
        ];
      },
      LoadedDraft: ({ text }): UpdateResult => [
        { ...model, localDraft: text, entryText: text ?? model.savedText },
        [],
      ],
      StoredDraft: (): UpdateResult => [model, []],
      GotImagePopoverMessage: ({ message: popoverMessage }): UpdateResult => {
        const [imagePopover, commands] = Popover.update(model.imagePopover, popoverMessage);
        return [
          { ...model, imagePopover },
          Command.mapMessages(commands, (childPopoverMessage) =>
            GotImagePopoverMessage({ message: childPopoverMessage }),
          ),
        ];
      },
      LoadedImages: ({ images }): UpdateResult => [{ ...model, images }, []],
      SelectedStoredImage: ({ mediaObjectId }): UpdateResult => [
        {
          ...model,
          elements: [...model.elements, imageElement(model, mediaObjectId)],
          selectedElementId: null,
          imagePopover: Popover.close(model.imagePopover)[0],
        },
        [],
      ],
      GotStickerPopoverMessage: ({ message: popoverMessage }): UpdateResult => {
        const [stickerPopover, commands] = Popover.update(model.stickerPopover, popoverMessage);
        return [
          { ...model, stickerPopover },
          Command.mapMessages(commands, (childPopoverMessage) =>
            GotStickerPopoverMessage({ message: childPopoverMessage }),
          ),
        ];
      },
      LoadedStickers: ({ stickers }): UpdateResult => [{ ...model, stickers }, []],
      SelectedStickerTab: ({ tab }): UpdateResult => [
        {
          ...model,
          stickerTab: tab,
          emojiList:
            tab === "emoji"
              ? VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 })
              : model.emojiList,
        },
        [],
      ],
      ChangedImageSearch: ({ value }): UpdateResult => [{ ...model, imageSearch: value }, []],
      ChangedStickerSearch: ({ value }): UpdateResult => [{ ...model, stickerSearch: value }, []],
      ChangedEmojiSearch: ({ value }): UpdateResult => [
        {
          ...model,
          emojiSearch: value,
          emojiList: VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 }),
        },
        [],
      ],
      GotEmojiListMessage: ({ message: listMessage }): UpdateResult => {
        const [emojiList, commands] = VirtualList.update(model.emojiList, listMessage);
        return [
          { ...model, emojiList },
          Command.mapMessages(commands, (commandMessage) =>
            GotEmojiListMessage({ message: commandMessage }),
          ),
        ];
      },
      SelectedEmoji: ({ emoji }): UpdateResult => [
        {
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
          stickerPopover: Popover.close(model.stickerPopover)[0],
        },
        [],
      ],
      SelectedSticker: ({ sticker }): UpdateResult => [
        {
          ...model,
          elements: [
            ...model.elements,
            {
              id: crypto.randomUUID() as never,
              payload: {
                kind: "sticker",
                stickerId: sticker.id,
                mediaObjectId: sticker.mediaObjectId,
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
          stickerPopover: Popover.close(model.stickerPopover)[0],
        },
        [],
      ],
      UploadedSticker: ({ sticker }): UpdateResult => [
        { ...model, stickers: [...model.stickers, sticker], uploadState: "idle" },
        [],
      ],
      GotUploadDialogMessage: ({ message: dialogMessage }): UpdateResult => {
        const [uploadDialog, commands] = Dialog.update(model.uploadDialog, dialogMessage);
        return [
          { ...model, uploadDialog },
          Command.mapMessages(commands, (childMessage) =>
            GotUploadDialogMessage({ message: childMessage }),
          ),
        ];
      },
      RequestedUpload: ({ file, kind }): UpdateResult => {
        const [uploadDialog, commands] = Dialog.open(model.uploadDialog);
        return [
          { ...model, uploadDialog, pendingUpload: { file, kind, title: (file as File).name } },
          Command.mapMessages(commands, (childMessage) =>
            GotUploadDialogMessage({ message: childMessage }),
          ),
        ];
      },
      ChangedUploadTitle: ({ title }): UpdateResult => [
        {
          ...model,
          pendingUpload: model.pendingUpload === null ? null : { ...model.pendingUpload, title },
        },
        [],
      ],
      ConfirmedUpload: (): UpdateResult => {
        if (model.pendingUpload === null) return [model, []];
        const pendingUpload = model.pendingUpload;
        const [uploadDialog, commands] = Dialog.close(model.uploadDialog);
        return [
          { ...model, uploadDialog, pendingUpload: null, uploadState: "uploading" },
          [
            ...Command.mapMessages(commands, (childMessage) =>
              GotUploadDialogMessage({ message: childMessage }),
            ),
            pendingUpload.kind === "image"
              ? uploadImage({ file: pendingUpload.file, title: pendingUpload.title })
              : uploadSticker({ file: pendingUpload.file, title: pendingUpload.title }),
          ],
        ];
      },
      GotStickerFileDropMessage: ({ message: fileDropMessage }): UpdateResult => {
        const [stickerFileDrop, _commands, outMessage] = FileDrop.update(
          model.stickerFileDrop,
          fileDropMessage,
        );
        return Option.match(outMessage, {
          onNone: () => [{ ...model, stickerFileDrop }, []],
          onSome: (out) =>
            out._tag === "ReceivedFiles"
              ? [
                  { ...model, stickerFileDrop },
                  out.files.map((file) => requestUpload({ file, kind: "sticker" })),
                ]
              : [{ ...model, stickerFileDrop }, []],
        });
      },
      GotFileDropMessage: ({ message: fileDropMessage }): UpdateResult => {
        const [fileDrop, _commands, outMessage] = FileDrop.update(model.fileDrop, fileDropMessage);
        return Option.match(outMessage, {
          onNone: () => [{ ...model, fileDrop }, []],
          onSome: (out) =>
            out._tag === "ReceivedFiles"
              ? [
                  { ...model, fileDrop },
                  out.files.map((file) => requestUpload({ file, kind: "image" })),
                ]
              : [{ ...model, fileDrop }, []],
        });
      },
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
      AddedTextCanvasElement: (): UpdateResult => addTextElement(model, ""),
      PastedCanvasText: ({ text }): UpdateResult => addTextElement(model, text),
      SelectedImage: ({ file }): UpdateResult =>
        update(model, RequestedUpload({ file, kind: "image" })),
      UploadedImage: ({ mediaObjectId, title }): UpdateResult => [
        {
          ...model,
          elements: [...model.elements, imageElement(model, mediaObjectId, title)],
          selectedElementId: null,
          images: model.images,
          uploadState: "idle",
        },
        [],
      ],
      SelectedCanvasElement: ({ id }): UpdateResult => [{ ...model, selectedElementId: id }, []],
      DeselectedCanvasElement: (): UpdateResult => [{ ...model, selectedElementId: null }, []],
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
          Command.mapMessages(commands, (dialogMessage) =>
            GotDeleteDialogMessage({ message: dialogMessage }),
          ),
        ];
      },
      GotDeleteDialogMessage: ({ message: dialogMessage }): UpdateResult => {
        const [deleteDialog, commands] = Dialog.update(model.deleteDialog, dialogMessage);
        return [
          { ...model, deleteDialog },
          Command.mapMessages(commands, (childMessage) =>
            GotDeleteDialogMessage({ message: childMessage }),
          ),
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
          },
          Command.mapMessages(commands, (dialogMessage) =>
            GotDeleteDialogMessage({ message: dialogMessage }),
          ),
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
        {
          ...model,
          elements: changeLayer(model.elements, model.selectedElementId, direction),
        },
        [],
      ],
      MovedCanvasElement: ({ id, x, y }): UpdateResult => [
        {
          ...model,
          elements: moveElement(model.elements, id, { x, y }),
        },
        [],
      ],
      StartedResize: ({ id, screenX, screenY, width, height }): UpdateResult => [
        { ...model, resizing: { id, screenX, screenY, width, height } },
        [],
      ],
      ResizedCanvasElement: ({ screenX, screenY }): UpdateResult => {
        if (model.resizing === null) return [model, []];
        const size = {
          width: Math.max(80, model.resizing.width + screenX - model.resizing.screenX),
          height: Math.max(80, model.resizing.height + screenY - model.resizing.screenY),
        };
        return [{ ...model, elements: resizeElement(model.elements, model.resizing.id, size) }, []];
      },
      FinishedResize: (): UpdateResult => [{ ...model, resizing: null }, []],
      FailedToUploadImage: (): UpdateResult => [{ ...model, uploadState: "failed" }, []],
      FailedToLoad: (): UpdateResult => [{ ...model, loadState: "failed" }, []],
      ChangedTextDocument: ({ id, document }): UpdateResult => [
        {
          ...model,
          elements: setTextDocument(model.elements, id, document),
          saveState: "idle",
        },
        [],
      ],
      ChangedText: ({ id, text }): UpdateResult => [
        {
          ...model,
          elements: setText(model.elements, id, text),
          localDraft: text,
          saveState: "idle",
        },
        [storeDraft({ date: model.selectedDate, text })],
      ],
      SaveRequested: (): UpdateResult => [
        { ...model, saveState: "saving" },
        [
          saveEntry({
            date: model.selectedDate,
            text: model.entryText,
            elements: model.elements,
          }),
        ],
      ],
      SavedEntry: ({ entry }): UpdateResult => [
        { ...model, savedText: model.entryText, localDraft: null, saveState: "idle" },
        [loadEntries({ month: entry.date.slice(0, 7) }), removeDraft({ date: model.selectedDate })],
      ],
      FailedToSave: (): UpdateResult => [{ ...model, saveState: "failed" }, []],
      DiscardedDraft: (): UpdateResult => [
        { ...model, entryText: model.savedText, localDraft: null, saveState: "idle" },
        [removeDraft({ date: model.selectedDate })],
      ],
    }),
  );

const addTextElement = (model: Model, text: string): UpdateResult => {
  const element = textElement(text);
  return [
    {
      ...model,
      elements: [...model.elements, { ...element, layer: nextLayer(model.elements) }],
      selectedElementId: element.id,
      saveState: "idle",
    },
    [],
  ];
};

const requestUpload = (args: { readonly file: unknown; readonly kind: "image" | "sticker" }) => ({
  name: "requestUpload",
  args,
  effect: Effect.succeed(RequestedUpload(args)),
});

const imageElement = (model: Model, mediaObjectId: string, title = "") => ({
  id: crypto.randomUUID() as never,
  payload: {
    kind: "image" as const,
    mediaObjectId: mediaObjectId as never,
    ...(title === "" ? {} : { alt: title }),
  },
  x: 80,
  y: 80,
  width: 480,
  height: 320,
  rotation: 0,
  layer: nextLayer(model.elements),
});

const entryText = (entry: DiaryEntry): string => {
  const element = entry.document.elements.find((value) => value.payload.kind === "text");
  if (element?.payload.kind !== "text") {
    return "";
  }
  const paragraph = element.payload.document.content?.[0];
  const content = paragraph?.["content"];
  if (!Array.isArray(content) || typeof content[0] !== "object" || content[0] === null) {
    return "";
  }
  const text = (content[0] as Record<string, unknown>)["text"];
  return typeof text === "string" ? text : "";
};
