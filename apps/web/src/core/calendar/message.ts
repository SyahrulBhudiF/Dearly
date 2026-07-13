import { Schema } from "effect";
import { EntryPreview, OwnerSession } from "@dearly/domain";
import { Message } from "foldkit";

export const SelectedDate = Message.m("SelectedDate", { date: Schema.String });
export const PreviewedDate = Message.m("PreviewedDate", { date: Schema.String });
export const ToggledPicker = Message.m("ToggledPicker");
export const ClosedPicker = Message.m("ClosedPicker");
export const PickedYear = Message.m("PickedYear", { year: Schema.Number });
export const ChangedMonth = Message.m("ChangedMonth", { month: Schema.String });
export const WentToday = Message.m("WentToday");
export const LoadedSession = Message.m("LoadedSession", { session: Schema.NullOr(OwnerSession) });
export const LoadedEntries = Message.m("LoadedEntries", { entries: Schema.Array(EntryPreview) });
export const FailedToLoad = Message.m("CalendarFailedToLoad");

export const CalendarMessage = Schema.Union([
  SelectedDate,
  PreviewedDate,
  ToggledPicker,
  ClosedPicker,
  PickedYear,
  ChangedMonth,
  WentToday,
  LoadedSession,
  LoadedEntries,
  FailedToLoad,
]);
export type CalendarMessage = Schema.Schema.Type<typeof CalendarMessage>;
