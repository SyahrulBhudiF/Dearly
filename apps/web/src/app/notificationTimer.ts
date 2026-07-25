import { Effect, Stream } from "effect";
import { DismissedNotification } from "./message";

export const notificationTimer = (id: string) =>
  Stream.fromEffect(
    Effect.sleep("4 seconds").pipe(Effect.as(DismissedNotification({ id }))),
  );
