import { Command } from "foldkit";
import { loadEntries, loadSession } from "../calendar/command";
import type { CalendarMessage } from "../calendar/message";
import { loadDraft, loadEntry } from "../entry/command";
import type { EntryMessage } from "../entry/message";
import { loadImages, loadStickers } from "../media/command";
import type { MediaMessage } from "../media/message";
import { GotCalendarMessage, GotEntryMessage, GotMediaMessage, type AppMessage } from "./message";
import type { Model } from "./model";

export const init = (
  model: Model,
): readonly [Model, ReadonlyArray<Command.Command<AppMessage>>] => [
  {
    ...model,
    calendar: { ...model.calendar, loadState: "loading" },
    entry:
      model.route._tag === "EntryRoute" ? { ...model.entry, loadState: "loading" } : model.entry,
  },
  [
    ...mapCalendar([loadSession(), loadEntries({ month: model.calendar.month })]),
    ...mapMedia([loadStickers(), loadImages()]),
    ...(model.route._tag === "EntryRoute"
      ? mapEntry([
          loadEntry({ date: model.calendar.selectedDate }),
          loadDraft({ date: model.calendar.selectedDate }),
        ])
      : []),
  ],
];

const mapCalendar = (commands: ReadonlyArray<Command.Command<CalendarMessage>>) =>
  Command.mapMessages(commands, (message) => GotCalendarMessage({ message }));
const mapEntry = (commands: ReadonlyArray<Command.Command<EntryMessage>>) =>
  Command.mapMessages(commands, (message) => GotEntryMessage({ message }));
const mapMedia = (commands: ReadonlyArray<Command.Command<MediaMessage>>) =>
  Command.mapMessages(commands, (message) => GotMediaMessage({ message }));
