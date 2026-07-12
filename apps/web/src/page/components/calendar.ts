import type { EntryPreview } from "@dearly/domain";
import { Html } from "foldkit";
import { monthLabel, nextMonth, previousMonth } from "../../libs/date";
import { ChangedMonth, SelectedDate } from "../../core/message";

type Message = ReturnType<typeof SelectedDate> | ReturnType<typeof ChangedMonth>;
type HtmlFactory = ReturnType<typeof Html.html<Message>>;

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const monthHeader = (h: HtmlFactory, month: string) => {
  const previous = previousMonth(month);
  const next = nextMonth(month);
  return h.div(
    [h.Class("flex items-center justify-between")],
    [
      h.button(
        [
          h.OnClick(ChangedMonth({ month: previous })),
          h.Class("font-note text-xs text-muted hover:text-wine"),
        ],
        ["← PREV"],
      ),
      h.h2([h.Class("font-display text-3xl")], [monthLabel(month)]),
      h.button(
        [
          h.OnClick(ChangedMonth({ month: next })),
          h.Class("font-note text-xs text-muted hover:text-wine"),
        ],
        ["NEXT →"],
      ),
    ],
  );
};

export const dateCard = (
  h: HtmlFactory,
  date: string,
  selectedDate: string,
  preview: EntryPreview | undefined,
) =>
  h.button(
    [
      h.OnClick(SelectedDate({ date })),
      h.Class(
        `date-card min-h-28 border-r border-b border-line p-2 text-left sm:min-h-36 sm:p-3 ${date === selectedDate ? "bg-rose/35" : preview?.hasSavedEntry ? "bg-sage/25" : "bg-paper"}`,
      ),
      h.AriaLabel(`Open ${date}`),
    ],
    [
      h.span([h.Class("font-note text-[11px] text-muted")], [String(Number(date.slice(-2)))]),
      preview?.snippet === undefined
        ? h.span([h.Class("mt-6 block text-xs text-muted/70")], ["—"])
        : h.p([h.Class("mt-5 line-clamp-3 font-display text-sm leading-5")], [preview.snippet]),
      preview?.hasDraft === true
        ? h.span(
            [h.Class("mt-2 block font-note text-[9px] tracking-[.12em] text-wine uppercase")],
            ["draft"],
          )
        : null,
    ],
  );

export const previewFor = (entries: ReadonlyArray<EntryPreview>, date: string) =>
  entries.find((entry) => entry.date === date);
