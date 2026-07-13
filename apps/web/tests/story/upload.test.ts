import { expect, test } from "vitest";
import { GotMediaMessage } from "../../src/core/app/message";
import { initialModel } from "../../src/core/app/model";
import { update } from "../../src/core/app/update";
import { ConfirmedUpload, RequestedUpload } from "../../src/core/media/message";
import { CalendarRoute } from "../../src/core/route";

const file = new File(["image"], "morning.png", { type: "image/png" });

test("image upload waits for title confirmation", () => {
  const [waiting, waitingCommands] = update(
    initialModel(CalendarRoute()),
    GotMediaMessage({ message: RequestedUpload({ file, kind: "image" }) }),
  );

  expect(waiting.media.pendingUpload?.title).toBe("morning.png");
  expect(waiting.media.uploadState).toBe("idle");
  expect(waitingCommands.some((command) => command.name === "uploadImage")).toBe(false);

  const [uploading, uploadCommands] = update(
    waiting,
    GotMediaMessage({ message: ConfirmedUpload() }),
  );
  expect(uploading.media.pendingUpload).toBeNull();
  expect(uploading.media.uploadState).toBe("uploading");
  expect(uploadCommands.some((command) => command.name === "uploadImage")).toBe(true);
});
