import { Scene } from "foldkit";
import { test } from "vitest";
import { loadEntries } from "../../src/core/command";
import { ClosedPicker } from "../../src/core/message";
import { initialModel } from "../../src/core/model";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";
import { view } from "../../src/view";

test("calendar month controls render and navigate", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.Mount.resolve({ name: "mini-calendar-picker" }, ClosedPicker()),
    Scene.expect(Scene.role("heading", { name: "Dearly" })).toExist(),
    Scene.click(Scene.role("button", { name: "Next month" })),
    Scene.Command.expectHas(loadEntries),
    Scene.Command.resolve(loadEntries, { _tag: "LoadedEntries", entries: [] }),
  );
});
