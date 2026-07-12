import { Scene } from "foldkit";
import { test } from "vitest";
import { initialModel } from "./core/model";
import { CalendarRoute } from "./core/route";
import { loadEntries } from "./core/command";
import { update } from "./core/update";
import { view } from "./view";

test("calendar month controls render and navigate", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.expect(Scene.role("heading", { name: "Dearly" })).toExist(),
    Scene.click(Scene.role("button", { name: "Next month" })),
    Scene.Command.expectHas(loadEntries),
    Scene.Command.resolve(loadEntries, { _tag: "LoadedEntries", entries: [] }),
  );
});
