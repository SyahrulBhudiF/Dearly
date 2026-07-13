import { Match } from "effect";
import { Command } from "foldkit";
import { loadEntries } from "../calendar/command";
import type { CalendarMessage } from "../calendar/message";
import * as Calendar from "../calendar/update";
import type { CanvasMessage } from "../canvas/message";
import * as Canvas from "../canvas/update";
import { loadDraft, loadEntry, saveEntry } from "../entry/command";
import { TextChanged, type EntryMessage } from "../entry/message";
import * as Entry from "../entry/update";
import { RequestedUpload, type MediaMessage } from "../media/message";
import * as Media from "../media/update";
import { CalendarRoute, EntryRoute } from "../route";
import {
  GotCalendarMessage,
  GotCanvasMessage,
  GotEntryMessage,
  GotMediaMessage,
  type AppMessage,
} from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<AppMessage>>];

export const update = (model: Model, message: AppMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      DismissedNotification: ({ id }): UpdateResult => [
        { ...model, notifications: model.notifications.filter((item) => item.id !== id) },
        [],
      ],
      ChangedRoute: ({ route }): UpdateResult => {
        if (route._tag !== "EntryRoute") return [{ ...model, route }, []];
        const date = route.date;
        const month = date.slice(0, 7);
        return [
          {
            ...model,
            route,
            calendar: { ...model.calendar, selectedDate: date, month, loadState: "loading" },
            entry: Entry.reset(model.entry),
            canvas: { ...Canvas.loadElements(model.canvas, []), elements: [] },
          },
          [
            ...mapCalendar([loadEntries({ month })]),
            ...mapEntry([loadEntry({ date }), loadDraft({ date })]),
          ],
        ];
      },
      GotCalendarMessage: ({ message: child }): UpdateResult => {
        if (child._tag === "SelectedDate") {
          return update(model, {
            _tag: "ChangedRoute",
            route: EntryRoute({ date: child.date as never }),
          });
        }
        const [calendar, commands] = Calendar.update(model.calendar, child);
        return [{ ...model, calendar }, mapCalendar(commands)];
      },
      GotCanvasMessage: ({ message: child }): UpdateResult => {
        if (child._tag === "CanvasRequestedUpload") {
          return update(
            model,
            GotMediaMessage({
              message: RequestedUpload({ file: child.file, kind: "image" }),
            }),
          );
        }
        const [canvas, commands] = Canvas.update(model.canvas, child);
        if (child._tag !== "ChangedText") {
          return [{ ...model, canvas }, mapCanvas(commands)];
        }
        const [entry, entryCommands] = Entry.update(
          model.entry,
          TextChanged({ text: child.text }),
          model.calendar.selectedDate,
        );
        return [{ ...model, canvas, entry }, [...mapCanvas(commands), ...mapEntry(entryCommands)]];
      },
      GotEntryMessage: ({ message: child }): UpdateResult => {
        const [entry, commands] = Entry.update(model.entry, child, model.calendar.selectedDate);
        if (child._tag === "DiscardedDraft") {
          return [
            {
              ...model,
              route: CalendarRoute(),
              entry,
              canvas: {
                ...Canvas.loadElements(model.canvas, []),
                elements: [],
              },
            },
            mapEntry(commands),
          ];
        }
        if (child._tag === "LoadedEntry") {
          return [
            {
              ...model,
              entry,
              canvas: Canvas.loadElements(
                model.canvas,
                child.entry === null ? [] : child.entry.document.elements,
              ),
            },
            mapEntry(commands),
          ];
        }
        if (child._tag === "SaveRequested") {
          return [
            { ...model, entry },
            [
              ...mapEntry(commands),
              ...mapEntry([
                saveEntry({
                  date: model.calendar.selectedDate,
                  text: model.entry.text,
                  elements: model.canvas.elements,
                }),
              ]),
            ],
          ];
        }
        if (child._tag === "SavedEntry") {
          return [
            notify({ ...model, entry }, "success", "Diary entry saved"),
            [
              ...mapEntry(commands),
              ...mapCalendar([loadEntries({ month: child.entry.date.slice(0, 7) })]),
            ],
          ];
        }
        if (child._tag === "FailedToSave") {
          return [
            notify({ ...model, entry }, "error", "Could not save diary entry"),
            mapEntry(commands),
          ];
        }
        return [{ ...model, entry }, mapEntry(commands)];
      },
      GotMediaMessage: ({ message: child }): UpdateResult => {
        const [media, commands] = Media.update(model.media, child);
        const canvas =
          child._tag === "SelectedStoredImage"
            ? Canvas.addImage(model.canvas, child.mediaObjectId)
            : child._tag === "UploadedImage"
              ? Canvas.addImage(model.canvas, child.mediaObjectId, child.title)
              : child._tag === "SelectedSticker"
                ? Canvas.addSticker(model.canvas, child.sticker)
                : child._tag === "SelectedEmoji"
                  ? Canvas.addEmoji(model.canvas, child.emoji)
                  : model.canvas;
        const next = { ...model, media, canvas };
        if (child._tag === "UploadedImage")
          return [notify(next, "success", "Image added to canvas"), mapMedia(commands)];
        if (child._tag === "UploadedSticker")
          return [notify(next, "success", "Sticker uploaded"), mapMedia(commands)];
        if (child._tag === "FailedToUploadImage")
          return [notify(next, "error", "Image upload failed"), mapMedia(commands)];
        return [next, mapMedia(commands)];
      },
    }),
  );

const notify = (model: Model, kind: "success" | "error" | "loading", message: string): Model => ({
  ...model,
  notifications: [...model.notifications.slice(-2), { id: crypto.randomUUID(), kind, message }],
});

const mapCalendar = (commands: ReadonlyArray<Command.Command<CalendarMessage>>) =>
  Command.mapMessages(commands, (message) => GotCalendarMessage({ message }));
const mapEntry = (commands: ReadonlyArray<Command.Command<EntryMessage>>) =>
  Command.mapMessages(commands, (message) => GotEntryMessage({ message }));
const mapCanvas = (commands: ReadonlyArray<Command.Command<CanvasMessage>>) =>
  Command.mapMessages(commands, (message) => GotCanvasMessage({ message }));
const mapMedia = (commands: ReadonlyArray<Command.Command<MediaMessage>>) =>
  Command.mapMessages(commands, (message) => GotMediaMessage({ message }));
