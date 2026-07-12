import { Effect, Queue, Stream } from "effect";
import { ClosedPicker } from "./message";

export const miniCalendarPicker = (): Stream.Stream<ReturnType<typeof ClosedPicker>> =>
  Stream.unwrap(
    Effect.gen(function* () {
      const messages = yield* Queue.bounded<ReturnType<typeof ClosedPicker>>(1);
      const close = (event: Event) => {
        const target = event.target;
        if (target instanceof Element && target.closest("[data-mini-calendar-picker]") === null) {
          Queue.offerUnsafe(messages, ClosedPicker());
        }
      };
      document.addEventListener("pointerdown", close);
      return Stream.fromQueue(messages).pipe(
        Stream.ensuring(
          Effect.sync(() => {
            document.removeEventListener("pointerdown", close);
            Queue.shutdown(messages);
          }),
        ),
      );
    }),
  );
