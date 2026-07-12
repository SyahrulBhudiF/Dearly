import { expect, test } from "vitest";
import { Story } from "foldkit";
import { storeDraft } from "../../src/core/command";
import { initialModel } from "../../src/core/model";
import { ChangedText } from "../../src/core/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

test("text becomes a movable canvas element", () => {
  Story.story(
    update,
    Story.with(initialModel(CalendarRoute())),
    Story.message(ChangedText({ text: "A quiet morning." })),
    Story.model((model) => {
      expect(model.elements).toHaveLength(1);
      expect(model.elements[0]?.payload.kind).toBe("text");
      expect(model.elements[0]?.x).toBe(80);
    }),
    Story.Command.resolve(storeDraft, { _tag: "StoredDraft" }),
  );
});
