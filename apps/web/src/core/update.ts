import { Match } from "effect";
import type { DiaryEntry } from "@dearly/domain";
import type { Command } from "foldkit";
import {
  loadDraft,
  loadEntries,
  loadEntry,
  loadSession,
  loadStickers,
  removeDraft,
  saveEntry,
  storeDraft,
  uploadImage,
} from "./command";
import { ChangedRoute, type AppMessage } from "./message";
import type { Model } from "./model";
import { EntryRoute } from "./route";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<AppMessage>>];

export const init = (model: Model): UpdateResult => [
  { ...model, loadState: "loading" },
  [
    loadSession(),
    loadEntries({ month: model.month }),
    loadStickers(),
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
            imageMediaObjectId: null,
            imageElementId: null,
            imagePosition: { x: 80, y: 80 },
            imageSize: { width: 480, height: 320 },
            stickerId: null,
            stickerMediaObjectId: null,
            stickerElementId: null,
            stickerPosition: { x: 620, y: 100 },
            stickerSize: { width: 160, height: 160 },
            resizing: null,
            stickerPickerOpen: false,
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
      ChangedMonth: ({ month }): UpdateResult => [
        { ...model, month, loadState: "loading" },
        [loadEntries({ month })],
      ],
      LoadedSession: ({ session }): UpdateResult => [{ ...model, session }, []],
      LoadedEntries: ({ entries }): UpdateResult => [{ ...model, entries, loadState: "idle" }, []],
      LoadedEntry: ({ entry }): UpdateResult => {
        const savedText = entry === null ? "" : entryText(entry);
        return [
          {
            ...model,
            savedText,
            entryText: model.localDraft ?? savedText,
            imageMediaObjectId: entry === null ? null : imageMediaObjectId(entry),
            imageElementId: null,
            imagePosition: entry === null ? { x: 80, y: 80 } : imagePosition(entry),
            imageSize: entry === null ? { width: 480, height: 320 } : imageSize(entry),
            stickerId: null,
            stickerMediaObjectId: null,
            stickerElementId: null,
            stickerPosition: { x: 620, y: 100 },
            stickerSize: { width: 160, height: 160 },
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
      ToggledStickerPicker: (): UpdateResult => [
        { ...model, stickerPickerOpen: !model.stickerPickerOpen },
        [],
      ],
      LoadedStickers: ({ stickers }): UpdateResult => [{ ...model, stickers }, []],
      SelectedSticker: ({ sticker }): UpdateResult => [
        {
          ...model,
          stickerId: sticker.id,
          stickerMediaObjectId: sticker.mediaObjectId,
          stickerElementId: null,
          stickerPosition: { x: 620, y: 100 },
          stickerSize: { width: 160, height: 160 },
          stickerPickerOpen: false,
        },
        [],
      ],
      SelectedImage: ({ file }): UpdateResult => [
        { ...model, uploadState: "uploading" },
        [uploadImage({ file })],
      ],
      UploadedImage: ({ mediaObjectId }): UpdateResult => [
        {
          ...model,
          imageMediaObjectId: mediaObjectId,
          imageElementId: null,
          imagePosition: { x: 80, y: 80 },
          imageSize: { width: 480, height: 320 },
          uploadState: "idle",
        },
        [],
      ],
      MovedCanvasElement: ({ id, x, y }): UpdateResult => [
        {
          ...model,
          ...(id === "image" ? { imagePosition: { x, y } } : { stickerPosition: { x, y } }),
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
        return [
          {
            ...model,
            ...(model.resizing.id === "image" ? { imageSize: size } : { stickerSize: size }),
          },
          [],
        ];
      },
      FinishedResize: (): UpdateResult => [{ ...model, resizing: null }, []],
      FailedToUploadImage: (): UpdateResult => [{ ...model, uploadState: "failed" }, []],
      FailedToLoad: (): UpdateResult => [{ ...model, loadState: "failed" }, []],
      ChangedText: ({ text }): UpdateResult => [
        { ...model, entryText: text, localDraft: text, saveState: "idle" },
        [storeDraft({ date: model.selectedDate, text })],
      ],
      SaveRequested: (): UpdateResult => [
        { ...model, saveState: "saving" },
        [
          saveEntry({
            date: model.selectedDate,
            text: model.entryText,
            imageMediaObjectId: model.imageMediaObjectId,
            stickerMediaObjectId: model.stickerMediaObjectId,
            stickerId: model.stickerId,
            imagePosition: model.imagePosition,
            imageSize: model.imageSize,
            stickerPosition: model.stickerPosition,
            stickerSize: model.stickerSize,
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

const imageMediaObjectId = (entry: DiaryEntry) => {
  const element = entry.document.elements.find((value) => value.payload.kind === "image");
  return element?.payload.kind === "image" ? element.payload.mediaObjectId : null;
};

const imagePosition = (entry: DiaryEntry) => {
  const element = entry.document.elements.find((value) => value.payload.kind === "image");
  return element?.payload.kind === "image" ? { x: element.x, y: element.y } : { x: 80, y: 80 };
};

const imageSize = (entry: DiaryEntry) => {
  const element = entry.document.elements.find((value) => value.payload.kind === "image");
  return element?.payload.kind === "image"
    ? { width: element.width, height: element.height }
    : { width: 480, height: 320 };
};

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
