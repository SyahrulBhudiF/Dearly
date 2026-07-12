import { Match } from "effect";
import type { DiaryEntry } from "@dearly/domain";
import type { Command } from "foldkit";
import { loadEntries, loadEntry, loadSession, saveEntry } from "./command";
import { ChangedRoute, type AppMessage } from "./message";
import type { Model } from "./model";
import { EntryRoute } from "./route";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<AppMessage>>];

export const init = (model: Model): UpdateResult => [
  { ...model, loadState: "loading" },
  [
    loadSession(),
    loadEntries({ month: model.month }),
    ...(model.route._tag === "EntryRoute" ? [loadEntry({ date: model.selectedDate })] : []),
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
          { ...model, route, selectedDate, month, entryText: "", savedText: "", saveState: "idle" },
          [loadEntries({ month }), loadEntry({ date: selectedDate })],
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
        const text = entry === null ? "" : entryText(entry);
        return [{ ...model, entryText: text, savedText: text, saveState: "idle" }, []];
      },
      FailedToLoad: (): UpdateResult => [{ ...model, loadState: "failed" }, []],
      ChangedText: ({ text }): UpdateResult => [
        { ...model, entryText: text, saveState: "idle" },
        [],
      ],
      SaveRequested: (): UpdateResult => [
        { ...model, saveState: "saving" },
        [saveEntry({ date: model.selectedDate, text: model.entryText })],
      ],
      SavedEntry: ({ entry }): UpdateResult => [
        { ...model, savedText: model.entryText, saveState: "idle" },
        [loadEntries({ month: entry.date.slice(0, 7) })],
      ],
      FailedToSave: (): UpdateResult => [{ ...model, saveState: "failed" }, []],
      DiscardedDraft: (): UpdateResult => [
        { ...model, entryText: model.savedText, saveState: "idle" },
        [],
      ],
    }),
  );

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
