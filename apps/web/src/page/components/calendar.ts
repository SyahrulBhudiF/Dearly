import type { EntryPreview } from "@dearly/domain";
import { Stream } from "effect";
import { Html } from "foldkit";
import { ArrowLeft, ArrowRight, ChevronDown, Download, X } from "lucide";
import { Button } from "@foldkit/ui";
import { dateLabel, monthDays, monthLabel, nextMonth, previousMonth, today } from "../../libs/date";
import { miniCalendarPicker } from "../../core/calendar/picker";
import {
  ChangedMonth,
  ClosedPicker,
  ClosedPhotoPreview,
  OpenedPhotoPreview,
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
  photoPreviewOpen: boolean,
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
            "mt-5 flex aspect-square flex-col overflow-hidden rounded-[var(--radius)] border border-line bg-secondary/25",
          ),
        ],
        [
          h.p([h.Class("shrink-0 border-b border-line/60 px-4 py-3 font-display text-xl")], ["Our photo"]),
          photoPreview(h, entries, selectedDate, photoPreviewOpen),
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
  photoPreviewOpen: boolean,
) => {
  const preview = entries.find(
    (entry) => entry.date === selectedDate && entry.thumbnailMediaObjectId !== undefined,
  );
  if (preview?.thumbnailMediaObjectId === undefined)
    return h.p(
      [h.Class("grid min-h-0 grow place-items-center px-6 text-center text-sm text-muted")],
      ["Your saved pictures will gather here."],
    );
  const src = `/media/${preview.thumbnailMediaObjectId}`;
  return h.div(
    [h.Class("min-h-0 grow")],
    [
      Button.view<AppMessage>({
        onClick: calendar(OpenedPhotoPreview()),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaLabel(`Preview photo from ${preview.date}`),
              h.Class("block size-full overflow-hidden text-left"),
            ],
            [
              h.img([
                h.Src(src),
                h.Alt(`Photo from ${preview.date}`),
                h.Class("size-full object-cover transition-transform duration-300 hover:scale-[1.02]"),
              ]),
            ],
          ),
      }),
      photoPreviewOpen ? photoModal(h, preview.date, src) : null,
    ],
  );
};

const photoModal = (h: HtmlFactory, date: string, src: string) =>
  h.div(
    [h.Role("dialog"), h.AriaLabel(`Photo from ${date}`), h.Class("fixed inset-0 z-50")],
    [
      h.button(
        [
          h.OnClick(calendar(ClosedPhotoPreview())),
          h.AriaLabel("Close photo preview"),
          h.Class("absolute inset-0 bg-ink/55"),
        ],
        [],
      ),
      h.div(
        [
          h.Class(
            "absolute top-1/2 left-1/2 w-[min(92vw,72rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius)] border border-line bg-paper shadow-[var(--shadow)]",
          ),
        ],
        [
          h.div(
            [h.Class("flex items-center justify-between border-b border-line px-4 py-3")],
            [
              h.div([], [
                h.p([h.Class("font-display text-xl")], ["Our photo"]),
                h.p([h.Class("font-note text-[10px] tracking-[.1em] text-muted uppercase")], [dateLabel(date)]),
              ]),
              h.div(
                [h.Class("flex items-center gap-2")],
                [
                  h.a(
                    [
                      h.Href(src),
                      h.Download(`dearly-${date}.webp`),
                      h.Class(
                        "flex items-center gap-2 rounded-full bg-primary px-4 py-2 font-note text-xs text-primary-foreground",
                      ),
                    ],
                    [icon(h, Download, "Download photo"), "Download"],
                  ),
                  h.button(
                    [
                      h.OnClick(calendar(ClosedPhotoPreview())),
                      h.AriaLabel("Close photo preview"),
                      h.Class("grid size-9 place-items-center rounded-full hover:bg-rose/30"),
                    ],
                    [icon(h, X, "Close")],
                  ),
                ],
              ),
            ],
          ),
          h.div(
            [h.Class("max-h-[78vh] overflow-auto bg-canvas p-3 sm:p-5")],
            [h.img([h.Src(src), h.Alt(`Photo from ${date}`), h.Class("mx-auto block max-h-[70vh] max-w-full object-contain")])],
          ),
        ],
      ),
    ],
  );

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
