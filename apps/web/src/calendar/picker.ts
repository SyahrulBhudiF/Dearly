import { Option, Stream } from "effect";
import { fromEventFilterMap } from "foldkit/subscription";
import { ClosedPicker } from "./message";

export const miniCalendarPicker = (): Stream.Stream<ReturnType<typeof ClosedPicker>> =>
  fromEventFilterMap<PointerEvent, ReturnType<typeof ClosedPicker>>({
    target: document,
    type: "pointerdown",
    toMessage: (event) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        document.querySelector(
          "[data-mini-calendar-picker] [data-mini-calendar-picker-open]",
        ) === null
      )
        return Option.none();
      if (target.closest("[data-mini-calendar-picker]") === null)
        return Option.some(ClosedPicker());
      return Option.none();
    },
  });
