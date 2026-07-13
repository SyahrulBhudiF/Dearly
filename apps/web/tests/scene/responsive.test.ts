import { Scene } from "foldkit";
import { test } from "vitest";
import { initialModel } from "../../src/core/app/model";
import { GotCalendarMessage } from "../../src/core/app/message";
import { ClosedPicker } from "../../src/core/calendar/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/app/update";
import { view } from "../../src/view";

test("calendar keeps mobile-first layout and hides desktop-only copy", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.Mount.resolve(
      { name: "mini-calendar-picker" },
      GotCalendarMessage({ message: ClosedPicker() }),
    ),
    Scene.expect(Scene.role("main")).toHaveClass("px-5"),
    Scene.expect(Scene.text("A quiet record of days worth keeping.")).toHaveClass("hidden"),
  );
});

test("calendar does not render the entry canvas", () => {
  Scene.scene(
    { update, view },
    Scene.with(initialModel(CalendarRoute())),
    Scene.Mount.resolve(
      { name: "mini-calendar-picker" },
      GotCalendarMessage({ message: ClosedPicker() }),
    ),
    Scene.expect(Scene.label("Diary entry")).not.toExist(),
  );
});
