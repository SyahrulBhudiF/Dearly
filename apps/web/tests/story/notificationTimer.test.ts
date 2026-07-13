import { Effect, Option, Stream } from "effect";
import { expect, test, vi } from "vitest";
import { notificationTimer } from "../../src/core/app/notificationTimer";

test("toast dismisses itself after four seconds", async () => {
  vi.useFakeTimers();
  const result = Effect.runPromise(Stream.runHead(notificationTimer("toast-id")));
  await vi.advanceTimersByTimeAsync(4_000);
  expect(Option.getOrElse(await result, () => null)).toEqual({
    _tag: "DismissedNotification",
    id: "toast-id",
  });
  vi.useRealTimers();
});
