import type { EntryPreview } from "@dearly/domain";
import { Story } from "foldkit";
import { expect, test } from "vitest";
import { GotCalendarMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { ClosedPhotoPreview, OpenedPhotoPreview } from "../../src/core/calendar/message";
import { CalendarRoute } from "../../src/core/route";

const preview: EntryPreview = {
  date: "2026-07-13" as never,
  snippet: "testing",
  thumbnailMediaObjectId: "00000000-0000-4000-8000-000000000001" as never,
  hasSavedEntry: true,
  hasDraft: false,
};

const seeded = () => {
  const model = initialModel(CalendarRoute());
  return {
    ...model,
    calendar: { ...model.calendar, selectedDate: preview.date, entries: [preview] },
  };
};

test("Our photo preview opens and closes", () => {
  Story.story(
    update,
    Story.with(seeded()),
    Story.message(GotCalendarMessage({ message: OpenedPhotoPreview() })),
    Story.model((model) => expect(model.calendar.photoPreviewOpen).toBe(true)),
    Story.message(GotCalendarMessage({ message: ClosedPhotoPreview() })),
    Story.model((model) => expect(model.calendar.photoPreviewOpen).toBe(false)),
  );
});
