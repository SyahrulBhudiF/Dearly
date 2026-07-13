import { Story } from "foldkit";
import { expect, test } from "vitest";
import { GotMediaMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { UploadedImage } from "../../src/core/media/message";
import { CalendarRoute } from "../../src/core/route";

const model = initialModel(CalendarRoute());

test("uploaded media becomes independently movable canvas elements", () => {
  Story.story(
    update,
    Story.with(model),
    Story.message(
      GotMediaMessage({
        message: UploadedImage({
          mediaObjectId: "00000000-0000-4000-8000-000000000001" as never,
          title: "First image",
        }),
      }),
    ),
    Story.message(
      GotMediaMessage({
        message: UploadedImage({
          mediaObjectId: "00000000-0000-4000-8000-000000000002" as never,
          title: "Second image",
        }),
      }),
    ),
    Story.model((next) => {
      expect(next.canvas.elements).toHaveLength(2);
      expect(next.canvas.elements[0]?.layer).toBe(0);
      expect(next.canvas.elements[1]?.layer).toBe(1);
    }),
  );
});
