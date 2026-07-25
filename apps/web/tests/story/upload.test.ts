import { expect, test } from "vitest";
import { GotMediaMessage } from "../../src/app/message";
import { initialModel } from "../../src/app/model";
import { update } from "../../src/app/update";
import {
  ConfirmedUpload,
  FailedToLoadMedia,
  FailedToUpload,
  RequestedUpload,
} from "../../src/media/message";
import { CalendarRoute } from "../../src/route";

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

test("media loading failures do not masquerade as upload failures", () => {
  const model = initialModel(CalendarRoute());
  const [afterLoadFailure] = update(model, GotMediaMessage({ message: FailedToLoadMedia() }));
  expect(afterLoadFailure.notifications).toEqual([]);

  const [afterUploadFailure] = update(model, GotMediaMessage({ message: FailedToUpload() }));
  expect(afterUploadFailure.notifications.map(({ message }) => message)).toEqual([
    "Image upload failed",
  ]);
});
