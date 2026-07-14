import { Scene } from "foldkit";
import { test } from "vitest";
import { loadEntries } from "../../src/core/calendar/command";
import { GotCalendarMessage } from "../../src/core/app/message";
import { ClosedPicker, LoadedEntries } from "../../src/core/calendar/message";
import { initialModel } from "../../src/core/app/model";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/app/update";
import { view } from "../../src/view";

test("calendar month controls render and navigate", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.Mount.resolve(
      { name: "mini-calendar-picker" },
      GotCalendarMessage({ message: ClosedPicker() }),
    ),
    Scene.expect(Scene.role("heading", { name: "Dearly" })).toExist(),
    Scene.click(Scene.role("button", { name: "Next month" })),
    Scene.Command.expectHas(loadEntries),
    Scene.Command.resolve(
      loadEntries,
      LoadedEntries({ entries: [] }),
    ),
  );
});
