import { Schema } from "effect";
import { Message } from "foldkit";
import { AppRoute } from "../route";
import { CalendarMessage } from "../calendar/message";
import { CanvasMessage } from "../canvas/message";
import { EntryMessage } from "../entry/message";
import { MediaMessage } from "../media/message";

export const ChangedRoute = Message.m("ChangedRoute", { route: AppRoute });
export const GotCalendarMessage = Message.m("GotCalendarMessage", { message: CalendarMessage });
export const GotEntryMessage = Message.m("GotEntryMessage", { message: EntryMessage });
export const GotCanvasMessage = Message.m("GotCanvasMessage", { message: CanvasMessage });
export const GotMediaMessage = Message.m("GotMediaMessage", { message: MediaMessage });

export const AppMessage = Schema.Union([
  ChangedRoute,
  GotCalendarMessage,
  GotEntryMessage,
  GotCanvasMessage,
  GotMediaMessage,
]);
export type AppMessage = Schema.Schema.Type<typeof AppMessage>;
