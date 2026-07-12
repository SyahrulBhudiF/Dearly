import { Schema } from "effect";
import { FileDrop } from "@foldkit/ui";
import { CalendarDate, CanvasElement, EntryPreview, OwnerSession, Sticker } from "@dearly/domain";
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
  elements: Schema.Array(CanvasElement),
  stickers: Schema.Array(Sticker),
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
    entries: [],
    session: null,
    loadState: "idle",
    entryText: "",
    savedText: "",
    localDraft: null,
    elements: [],
    stickers: [],
    resizing: null,
    stickerPickerOpen: false,
    fileDrop: FileDrop.init({ id: "entry-media" }),
    uploadState: "idle",
    saveState: "idle",
  };
};

export const toCalendarDate = (date: string) => Schema.decodeUnknownOption(CalendarDate)(date);
