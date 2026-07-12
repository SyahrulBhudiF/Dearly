import { Match, Option } from "effect";
import { FileDrop, Popover } from "@foldkit/ui";
import type { CanvasElement, DiaryEntry } from "@dearly/domain";
import { Command } from "foldkit";
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
import { ChangedRoute, GotStickerPopoverMessage, type AppMessage } from "./message";
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
            elements: [],
            resizing: null,
            stickerPopover: Popover.init({ id: "sticker-picker" }),
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
            elements: entry === null ? [] : nonTextElements(entry),
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
      GotStickerPopoverMessage: ({ message: popoverMessage }): UpdateResult => {
        const [stickerPopover, commands] = Popover.update(model.stickerPopover, popoverMessage);
        return [
          { ...model, stickerPopover },
          Command.mapMessages(commands, (message) => GotStickerPopoverMessage({ message })),
        ];
      },
      LoadedStickers: ({ stickers }): UpdateResult => [{ ...model, stickers }, []],
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
              layer: model.elements.length,
            },
          ],
          stickerPopover: Popover.close(model.stickerPopover)[0],
        },
        [],
      ],
      GotFileDropMessage: ({ message }): UpdateResult => {
        const [fileDrop, _commands, outMessage] = FileDrop.update(model.fileDrop, message);
        return Option.match(outMessage, {
          onNone: () => [{ ...model, fileDrop }, []],
          onSome: (out) =>
            out._tag === "ReceivedFiles"
              ? [
                  { ...model, fileDrop, uploadState: "uploading" },
                  out.files.map((file) => uploadImage({ file })),
                ]
              : [{ ...model, fileDrop }, []],
        });
      },
      SelectedImage: ({ file }): UpdateResult => [
        { ...model, uploadState: "uploading" },
        [uploadImage({ file })],
      ],
      UploadedImage: ({ mediaObjectId }): UpdateResult => [
        {
          ...model,
          elements: [
            ...model.elements,
            {
              id: crypto.randomUUID() as never,
              payload: { kind: "image", mediaObjectId },
              x: 80,
              y: 80,
              width: 480,
              height: 320,
              rotation: 0,
              layer: model.elements.length,
            },
          ],
          uploadState: "idle",
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

const nonTextElements = (entry: DiaryEntry) =>
  entry.document.elements.filter((element) => element.payload.kind !== "text");

const moveElement = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  position: { readonly x: number; readonly y: number },
) => elements.map((element) => (element.id === id ? { ...element, ...position } : element));

const resizeElement = (
  elements: ReadonlyArray<CanvasElement>,
  id: string,
  size: { readonly width: number; readonly height: number },
) => elements.map((element) => (element.id === id ? { ...element, ...size } : element));

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
