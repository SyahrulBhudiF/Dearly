import type { EntryPreview } from "@dearly/domain";
import { Stream } from "effect";
import { Html } from "foldkit";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide";
import { Button } from "@foldkit/ui";
import { monthDays, monthLabel, nextMonth, previousMonth, today } from "../../libs/date";
import { miniCalendarPicker } from "../../core/calendar/picker";
import {
  ChangedMonth,
  ClosedPicker,
  PreviewedDate,
  SelectedDate,
  ToggledPicker,
  PickedYear,
  WentToday,
} from "../../core/calendar/message";
import type { AppMessage } from "../../core/app/message";
import { GotCalendarMessage } from "../../core/app/message";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const monthHeader = (h: HtmlFactory, month: string, _selectedDate: string) => {
  const previous = previousMonth(month);
  const next = nextMonth(month);
  return h.div(
    [h.Class("flex items-center justify-between")],
    [
      h.div(
        [h.Class("flex items-center gap-3")],
        [
          Button.view<AppMessage>({
            onClick: calendar(ChangedMonth({ month: previous })),
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.AriaLabel("Previous month"),
                  h.Class("flex items-center gap-1 font-note text-xs text-muted hover:text-wine"),
                ],
                [icon(h, ArrowLeft, "Previous month"), "PREV"],
              ),
          }),
        ],
      ),
      h.h2([h.Class("font-display text-3xl")], [monthLabel(month)]),
      Button.view<AppMessage>({
        onClick: calendar(ChangedMonth({ month: next })),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaLabel("Next month"),
              h.Class("flex items-center gap-1 font-note text-xs text-muted hover:text-wine"),
            ],
            ["NEXT", icon(h, ArrowRight, "Next month")],
          ),
      }),
    ],
  );
};

export const miniCalendar = (
  h: HtmlFactory,
  month: string,
  selectedDate: string,
  entries: ReadonlyArray<EntryPreview>,
  pickerOpen: boolean,
  pickerYear: number,
) =>
  h.aside(
    [h.Class("hidden lg:block")],
    [
      h.div(
        [h.Class("rounded-[var(--radius)] border border-line bg-card p-4")],
        [
          h.div(
            [
              h.OnMount({
                name: "mini-calendar-picker",
                f: () => miniCalendarPicker().pipe(Stream.map(calendar)),
              }),
              h.DataAttribute("mini-calendar-picker", "true"),
              h.Class("relative"),
            ],
            [
              Button.view<AppMessage>({
                onClick: calendar(ToggledPicker()),
                toView: ({ button }) =>
                  h.button(
                    [
                      ...button,
                      h.AriaLabel("Choose month and year"),
                      h.Class(
                        "flex w-full items-center justify-between font-display text-lg text-ink",
                      ),
                    ],
                    [monthLabel(month), icon(h, ChevronDown, "Choose month and year")],
                  ),
              }),
              pickerOpen ? monthPicker(h, month, pickerYear) : null,
            ],
          ),
          h.div(
            [
              h.Class(
                "mt-4 grid grid-cols-7 text-center font-note text-[9px] text-muted uppercase",
              ),
            ],
            [
              ...weekdays.map((weekday) => h.span([], [weekday.slice(0, 1)])),
              ...monthDays(month).map((date) =>
                Button.view<AppMessage>({
                  onClick: calendar(PreviewedDate({ date })),
                  toView: ({ button }) =>
                    h.button(
                      [
                        ...button,
                        h.AriaLabel(`Preview ${date}`),
                        h.Class(
                          `aspect-square text-[10px] ${date === selectedDate ? "rounded-full bg-primary text-primary-foreground" : previewFor(entries, date) !== undefined ? "font-bold text-wine" : "text-muted"}`,
                        ),
                      ],
                      [String(Number(date.slice(-2)))],
                    ),
                }),
              ),
            ],
          ),
          month !== today().slice(0, 7)
            ? Button.view<AppMessage>({
                onClick: calendar(WentToday()),
                toView: ({ button }) =>
                  h.button(
                    [
                      ...button,
                      h.Class(
                        "mt-4 w-full rounded-md bg-primary px-3 py-2 font-note text-[10px] text-primary-foreground uppercase hover:opacity-85",
                      ),
                    ],
                    ["Back to today"],
                  ),
              })
            : null,
        ],
      ),
      h.div(
        [
          h.Class(
            "mt-5 aspect-square overflow-hidden rounded-[var(--radius)] border border-line bg-secondary/25",
          ),
        ],
        [
          h.p([h.Class("p-4 font-display text-xl")], ["Our photo"]),
          photoPreview(h, entries, selectedDate),
        ],
      ),
    ],
  );

const monthPicker = (h: HtmlFactory, selectedMonth: string, year: number) =>
  h.div(
    [
      h.Class(
        "absolute left-1/2 z-20 mt-2 w-[260px] -translate-x-1/2 rounded-[var(--radius)] border border-line bg-card p-3 shadow-[var(--shadow)]",
      ),
    ],
    [
      h.div(
        [h.Class("mb-3 flex items-center justify-between")],
        [
          Button.view<AppMessage>({
            onClick: calendar(PickedYear({ year: year - 1 })),
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.AriaLabel("Previous year"),
                  h.Class("p-1 text-muted hover:text-wine"),
                ],
                [icon(h, ArrowLeft, "Previous year")],
              ),
          }),
          h.p([h.Class("font-display text-lg")], [String(year)]),
          Button.view<AppMessage>({
            onClick: calendar(PickedYear({ year: year + 1 })),
            toView: ({ button }) =>
              h.button(
                [...button, h.AriaLabel("Next year"), h.Class("p-1 text-muted hover:text-wine")],
                [icon(h, ArrowRight, "Next year")],
              ),
          }),
        ],
      ),
      h.div(
        [h.Class("grid grid-cols-3 gap-1")],
        Array.from({ length: 12 }, (_month, index) => {
          const month = `${year}-${String(index + 1).padStart(2, "0")}`;
          return Button.view<AppMessage>({
            onClick: calendar(ChangedMonth({ month })),
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    `rounded-md py-2 font-note text-xs ${month === selectedMonth ? "bg-primary text-primary-foreground" : "text-muted hover:bg-accent"}`,
                  ),
                ],
                [monthLabel(month).slice(0, 3)],
              ),
          });
        }),
      ),
    ],
  );

const photoPreview = (
  h: HtmlFactory,
  entries: ReadonlyArray<EntryPreview>,
  selectedDate: string,
) => {
  const preview = entries.find(
    (entry) => entry.date === selectedDate && entry.thumbnailMediaObjectId !== undefined,
  );
  return preview?.thumbnailMediaObjectId === undefined
    ? h.p([h.Class("px-4 text-sm text-muted")], ["Your saved pictures will gather here."])
    : h.img([
        h.Src(`/media/${preview.thumbnailMediaObjectId}`),
        h.Alt(`Photo from ${preview.date}`),
        h.Class("h-full w-full object-cover"),
      ]);
};

export const dateCard = (
  h: HtmlFactory,
  date: string,
  selectedDate: string,
  preview: EntryPreview | undefined,
) =>
  Button.view<AppMessage>({
    onClick: calendar(SelectedDate({ date })),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.Class(
            `date-card min-h-28 border-r border-b border-line p-2 text-left sm:min-h-36 sm:p-3 ${date === selectedDate ? "bg-primary/30" : preview?.hasSavedEntry ? "bg-secondary/30" : "bg-card"}`,
          ),
          h.AriaLabel(`Open ${date}`),
        ],
        [
          h.span(
            [h.Class("font-note text-[11px] text-muted-foreground")],
            [String(Number(date.slice(-2)))],
          ),
          preview?.snippet === undefined
            ? h.span([h.Class("mt-6 block text-xs text-muted-foreground/70")], ["—"])
            : h.p([h.Class("mt-5 line-clamp-3 font-display text-sm leading-5")], [preview.snippet]),
          preview?.hasDraft === true
            ? h.span(
                [h.Class("mt-2 block font-note text-[9px] tracking-[.12em] text-wine uppercase")],
                ["draft"],
              )
            : null,
        ],
      ),
  });

export const previewFor = (entries: ReadonlyArray<EntryPreview>, date: string) =>
  entries.find((entry) => entry.date === date);

const calendar = (message: import("../../core/calendar/message").CalendarMessage): AppMessage =>
  GotCalendarMessage({ message });
