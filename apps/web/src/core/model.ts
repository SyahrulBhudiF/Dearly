import { Schema } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import {
  CalendarDate,
  CanvasElement,
  EntryPreview,
  MediaObject,
  OwnerSession,
  Sticker,
} from "@dearly/domain";
import { today } from "../libs/date";
import { CalendarRoute, EntryRoute, NotFoundRoute, type AppRoute } from "./route";

export type LoadState = "idle" | "loading" | "failed";
export type SaveState = "idle" | "saving" | "failed";

export const Model = Schema.Struct({
  route: Schema.Union([CalendarRoute, EntryRoute, NotFoundRoute]),
  month: Schema.String,
  selectedDate: Schema.String,
  miniCalendarPickerOpen: Schema.Boolean,
  miniCalendarPickerYear: Schema.Number,
  entries: Schema.Array(EntryPreview),
  session: Schema.NullOr(OwnerSession),
  loadState: Schema.Literals(["idle", "loading", "failed"]),
  entryText: Schema.String,
  savedText: Schema.String,
  localDraft: Schema.NullOr(Schema.String),
  elements: Schema.Array(CanvasElement),
  selectedElementId: Schema.NullOr(Schema.String),
  deleteDialog: Dialog.Model,
  uploadDialog: Dialog.Model,
  pendingUpload: Schema.NullOr(
    Schema.Struct({
      file: Schema.Any,
      kind: Schema.Literals(["image", "sticker"]),
      title: Schema.String,
    }),
  ),
  stickers: Schema.Array(Sticker),
  images: Schema.Array(MediaObject),
  imagePopover: Popover.Model,
  imageSearch: Schema.String,
  stickerSearch: Schema.String,
  emojiSearch: Schema.String,
  emojiList: VirtualList.Model,
  resizing: Schema.NullOr(
    Schema.Struct({
      id: Schema.String,
      screenX: Schema.Number,
      screenY: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
    }),
  ),
  stickerPopover: Popover.Model,
  stickerTab: Schema.Literals(["stickers", "emoji"]),
  stickerFileDrop: FileDrop.Model,
  fileDrop: FileDrop.Model,
  uploadState: Schema.Literals(["idle", "uploading", "failed"]),
  saveState: Schema.Literals(["idle", "saving", "failed"]),
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (route: AppRoute): Model => {
  const selectedDate = "date" in route ? route.date : today();
  return {
    route,
    month: selectedDate.slice(0, 7),
    selectedDate,
    miniCalendarPickerOpen: false,
    miniCalendarPickerYear: Number(selectedDate.slice(0, 4)),
    entries: [],
    session: null,
    loadState: "idle",
    entryText: "",
    savedText: "",
    localDraft: null,
    elements: [],
    selectedElementId: null,
    deleteDialog: Dialog.init({ id: "delete-canvas-element" }),
    uploadDialog: Dialog.init({ id: "upload-title" }),
    pendingUpload: null,
    stickers: [],
    images: [],
    imagePopover: Popover.init({ id: "image-picker" }),
    imageSearch: "",
    stickerSearch: "",
    emojiSearch: "",
    emojiList: VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 }),
    resizing: null,
    stickerPopover: Popover.init({ id: "sticker-picker" }),
    stickerTab: "stickers",
    stickerFileDrop: FileDrop.init({ id: "sticker-media" }),
    fileDrop: FileDrop.init({ id: "entry-media" }),
    uploadState: "idle",
    saveState: "idle",
  };
};

export const toCalendarDate = (date: string) => Schema.decodeUnknownOption(CalendarDate)(date);
