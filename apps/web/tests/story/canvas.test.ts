import { Story } from "foldkit";
import { expect, test } from "vitest";
import { initialModel } from "../../src/core/model";
import { UploadedImage } from "../../src/core/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

const model = initialModel(CalendarRoute());

test("uploaded media becomes independently movable canvas elements", () => {
  Story.story(
    update,
    Story.with(model),
    Story.message(
      UploadedImage({ mediaObjectId: "00000000-0000-4000-8000-000000000001" as never }),
    ),
    Story.message(
      UploadedImage({ mediaObjectId: "00000000-0000-4000-8000-000000000002" as never }),
    ),
    Story.model((next) => {
      expect(next.elements).toHaveLength(2);
      expect(next.elements[0]?.layer).toBe(0);
      expect(next.elements[1]?.layer).toBe(1);
    }),
  );
});
