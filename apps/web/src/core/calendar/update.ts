import { Match } from "effect";
import { Command } from "foldkit";
import { today } from "../../libs/date";
import { loadEntries } from "./command";
import type { CalendarMessage } from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<CalendarMessage>>];

export const update = (model: Model, message: CalendarMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      SelectedDate: (): UpdateResult => [model, []],
      PreviewedDate: ({ date }): UpdateResult => [{ ...model, selectedDate: date }, []],
      ToggledPicker: (): UpdateResult => [
        {
          ...model,
          pickerOpen: !model.pickerOpen,
          pickerYear: Number(model.month.slice(0, 4)),
        },
        [],
      ],
      ClosedPicker: (): UpdateResult => [{ ...model, pickerOpen: false }, []],
      PickedYear: ({ year }): UpdateResult => [{ ...model, pickerYear: year }, []],
      ChangedMonth: ({ month }): UpdateResult => [
        { ...model, month, loadState: "loading", pickerOpen: false },
        [loadEntries({ month })],
      ],
      WentToday: (): UpdateResult => {
        const date = today();
        const month = date.slice(0, 7);
        return [
          { ...model, selectedDate: date, month, loadState: "loading" },
          [loadEntries({ month })],
        ];
      },
      LoadedSession: ({ session }): UpdateResult => [{ ...model, session }, []],
      LoadedEntries: ({ entries }): UpdateResult => [{ ...model, entries, loadState: "idle" }, []],
      CalendarFailedToLoad: (): UpdateResult => [{ ...model, loadState: "failed" }, []],
    }),
  );
