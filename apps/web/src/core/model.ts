import { Schema } from "effect";
import {
  CalendarDate,
  CanvasElementId,
  EntryPreview,
  MediaObjectId,
  OwnerSession,
  Sticker,
  StickerId,
} from "@dearly/domain";
import { today } from "../libs/date";
import { CalendarRoute, EntryRoute, NotFoundRoute, type AppRoute } from "./route";

export type LoadState = "idle" | "loading" | "failed";
export type SaveState = "idle" | "saving" | "failed";

export const Model = Schema.Struct({
  route: Schema.Union([CalendarRoute, EntryRoute, NotFoundRoute]),
  month: Schema.String,
  selectedDate: Schema.String,
  entries: Schema.Array(EntryPreview),
  session: Schema.NullOr(OwnerSession),
  loadState: Schema.Literals(["idle", "loading", "failed"]),
  entryText: Schema.String,
  savedText: Schema.String,
  localDraft: Schema.NullOr(Schema.String),
  imageMediaObjectId: Schema.NullOr(MediaObjectId),
  imageElementId: Schema.NullOr(CanvasElementId),
  imagePosition: Schema.Struct({ x: Schema.Number, y: Schema.Number }),
  imageSize: Schema.Struct({ width: Schema.Number, height: Schema.Number }),
  stickers: Schema.Array(Sticker),
  stickerId: Schema.NullOr(StickerId),
  stickerMediaObjectId: Schema.NullOr(MediaObjectId),
  stickerElementId: Schema.NullOr(CanvasElementId),
  stickerPosition: Schema.Struct({ x: Schema.Number, y: Schema.Number }),
  stickerSize: Schema.Struct({ width: Schema.Number, height: Schema.Number }),
  resizing: Schema.NullOr(
    Schema.Struct({
      id: Schema.String,
      screenX: Schema.Number,
      screenY: Schema.Number,
      width: Schema.Number,
      height: Schema.Number,
    }),
  ),
  stickerPickerOpen: Schema.Boolean,
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
    entries: [],
    session: null,
    loadState: "idle",
    entryText: "",
    savedText: "",
    localDraft: null,
    imageMediaObjectId: null,
    imageElementId: null,
    imagePosition: { x: 80, y: 80 },
    imageSize: { width: 480, height: 320 },
    stickers: [],
    stickerId: null,
    stickerMediaObjectId: null,
    stickerElementId: null,
    stickerPosition: { x: 620, y: 100 },
    stickerSize: { width: 160, height: 160 },
    resizing: null,
    stickerPickerOpen: false,
    uploadState: "idle",
    saveState: "idle",
  };
};

export const toCalendarDate = (date: string) => Schema.decodeUnknownOption(CalendarDate)(date);
