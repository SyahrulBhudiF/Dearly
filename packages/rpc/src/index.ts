import {
  CalendarDate,
  CalendarMonth,
  CreateMediaUploadPayload,
  DiaryEntry,
  DraftConflict,
  EntryNotFound,
  EntryPreview,
  MediaObject,
  MediaObjectId,
  MediaTooLarge,
  MediaUpload,
  OwnerSession,
  SaveEntryPayload,
  Sticker,
  StickerId,
  Unauthorized,
} from "@dearly/domain";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { Schema } from "effect";

export const DearlyErrors = Schema.Union([
  Unauthorized,
  EntryNotFound,
  MediaTooLarge,
  DraftConflict,
]);

export const DearlyRpc = RpcGroup.make(
  Rpc.make("getSession", {
    success: Schema.NullOr(OwnerSession),
    error: DearlyErrors,
  }),
  Rpc.make("listMonthEntries", {
    payload: { month: CalendarMonth },
    success: Schema.Array(EntryPreview),
    error: DearlyErrors,
  }),
  Rpc.make("getEntryByDate", {
    payload: { date: CalendarDate },
    success: DiaryEntry,
    error: DearlyErrors,
  }),
  Rpc.make("saveEntry", {
    payload: SaveEntryPayload,
    success: DiaryEntry,
    error: DearlyErrors,
  }),
  Rpc.make("discardServerEntry", {
    payload: { date: CalendarDate },
    success: Schema.Void,
    error: DearlyErrors,
  }),
  Rpc.make("createMediaUpload", {
    payload: CreateMediaUploadPayload,
    success: MediaUpload,
    error: DearlyErrors,
  }),
  Rpc.make("getMediaObject", {
    payload: { mediaObjectId: MediaObjectId },
    success: MediaObject,
    error: DearlyErrors,
  }),
  Rpc.make("listStickers", {
    success: Schema.Array(Sticker),
    error: DearlyErrors,
  }),
  Rpc.make("createSticker", {
    payload: { mediaObjectId: MediaObjectId, label: Schema.String },
    success: Sticker,
    error: DearlyErrors,
  }),
  Rpc.make("deleteStickerFromPicker", {
    payload: { stickerId: StickerId },
    success: Schema.Void,
    error: DearlyErrors,
  }),
);

export type DearlyRpc = typeof DearlyRpc;
