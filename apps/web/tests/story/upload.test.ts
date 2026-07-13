import { expect, test } from "vitest";
import { initialModel } from "../../src/core/model";
import { ConfirmedUpload, RequestedUpload } from "../../src/core/message";
import { CalendarRoute } from "../../src/core/route";
import { update } from "../../src/core/update";

const file = new File(["image"], "morning.png", { type: "image/png" });

test("image upload waits for title confirmation", () => {
  const [waiting, waitingCommands] = update(
    initialModel(CalendarRoute()),
    RequestedUpload({ file, kind: "image" }),
  );

  expect(waiting.pendingUpload?.title).toBe("morning.png");
  expect(waiting.uploadState).toBe("idle");
  expect(waitingCommands.some((command) => command.name === "uploadImage")).toBe(false);

  const [uploading, uploadCommands] = update(waiting, ConfirmedUpload());
  expect(uploading.pendingUpload).toBeNull();
  expect(uploading.uploadState).toBe("uploading");
  expect(uploadCommands.some((command) => command.name === "uploadImage")).toBe(true);
});
