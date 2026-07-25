import { Match } from "effect";
import { Dialog } from "@foldkit/ui";
import type { DiaryEntry } from "@dearly/domain";
import { Command } from "foldkit";
import { removeDraft, storeDraft } from "./command";
import { GotDiscardDialogMessage, type EntryMessage } from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<EntryMessage>>];

export const update = (model: Model, message: EntryMessage, date: string): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      LoadedEntry: ({ entry }): UpdateResult => {
        const savedText = entry === null ? "" : entryText(entry);
        return [
          {
            ...model,
            savedText,
            text: model.localDraft ?? savedText,
            loadState: "idle",
            saveState: "idle",
          },
          [],
        ];
      },
      LoadedDraft: ({ text }): UpdateResult => [
        { ...model, localDraft: text, text: text ?? model.savedText },
        [],
      ],
      StoredDraft: (): UpdateResult => [model, []],
      EntryTextChanged: ({ text }): UpdateResult => [
        { ...model, text, localDraft: text, saveState: "idle" },
        [storeDraft({ date, text })],
      ],
      SaveRequested: (): UpdateResult => [{ ...model, saveState: "saving" }, []],
      SavedEntry: (): UpdateResult => [
        { ...model, savedText: model.text, localDraft: null, saveState: "idle" },
        [removeDraft({ date })],
      ],
      FailedToSave: (): UpdateResult => [{ ...model, saveState: "failed" }, []],
      EntryFailedToLoad: (): UpdateResult => [{ ...model, loadState: "failed" }, []],
      RequestedDiscard: (): UpdateResult => {
        const [discardDialog, commands] = Dialog.open(model.discardDialog);
        return [
          { ...model, discardDialog },
          Command.mapMessages(commands, (message) => GotDiscardDialogMessage({ message })),
        ];
      },
      GotDiscardDialogMessage: ({ message }): UpdateResult => {
        const [discardDialog, commands] = Dialog.update(model.discardDialog, message);
        return [
          { ...model, discardDialog },
          Command.mapMessages(commands, (child) => GotDiscardDialogMessage({ message: child })),
        ];
      },
      DiscardedDraft: (): UpdateResult => [
        { ...model, text: model.savedText, localDraft: null, saveState: "idle" },
        [removeDraft({ date })],
      ],
    }),
  );

export const reset = (model: Model): Model => ({
  ...model,
  text: "",
  savedText: "",
  localDraft: null,
  loadState: "loading",
  saveState: "idle",
  discardDialog: Dialog.init({ id: "discard-entry" }),
});

const entryText = (entry: DiaryEntry): string => {
  const element = entry.document.elements.find((value) => value.payload.kind === "text");
  if (element?.payload.kind !== "text") return "";
  const content = element.payload.document.content?.[0]?.["content"];
  if (!Array.isArray(content) || typeof content[0] !== "object" || content[0] === null) return "";
  const text = (content[0] as Record<string, unknown>)["text"];
  return typeof text === "string" ? text : "";
};
