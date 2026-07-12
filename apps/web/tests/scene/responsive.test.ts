import { Scene } from "foldkit";
import { test } from "vitest";
import { initialModel } from "../../src/core/model";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";
import { view } from "../../src/view";

test("calendar keeps mobile-first layout and hides desktop-only copy", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.expect(Scene.role("main")).toHaveClass("px-5"),
    Scene.expect(Scene.text("A quiet record of days worth keeping.")).toHaveClass("hidden"),
  );
});

test("calendar does not render the entry canvas", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.expect(Scene.label("Diary entry")).not.toExist(),
  );
});
