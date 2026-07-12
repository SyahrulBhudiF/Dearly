import { Html } from "foldkit";
import { monthDays } from "../libs/date";
import { ChangedMonth, SelectedDate } from "../core/message";
import type { Model } from "../core/model";
import { dateCard, monthHeader, previewFor, weekdays } from "./components/calendar";

export const calendarPage = (model: Model): Html.Document => {
  const h = Html.html<ReturnType<typeof SelectedDate> | ReturnType<typeof ChangedMonth>>();
  const { month, selectedDate } = model;

  return {
    title: "Dearly — calendar",
    body: h.main(
      [h.Class("paper-grain min-h-screen bg-paper px-5 py-7 text-ink sm:px-10 lg:px-16")],
      [
        h.header(
          [h.Class("mx-auto flex max-w-6xl items-end justify-between border-b border-line pb-7")],
          [
            h.div(
              [],
              [
                h.p(
                  [h.Class("font-note text-[10px] tracking-[.18em] text-wine uppercase")],
                  ["PRIVATE DIARY · ASIA/JAKARTA"],
                ),
                h.h1(
                  [h.Class("mt-2 font-display text-5xl leading-none tracking-tight sm:text-6xl")],
                  ["Dearly"],
                ),
              ],
            ),
            h.p(
              [h.Class("hidden max-w-48 text-right text-sm leading-5 text-muted sm:block")],
              ["A quiet record of days worth keeping."],
            ),
          ],
        ),
        h.section(
          [h.Class("mx-auto max-w-6xl pt-9")],
          [
            monthHeader(h, month),
            h.div(
              [h.Class("mt-8 grid grid-cols-7 border-t border-l border-line")],
              [
                ...weekdays.map((weekday) =>
                  h.div(
                    [
                      h.Class(
                        "border-r border-b border-line px-2 py-3 font-note text-[10px] tracking-[.12em] text-muted uppercase",
                      ),
                    ],
                    [weekday],
                  ),
                ),
                ...monthDays(month).map((date) =>
                  dateCard(h, date, selectedDate, previewFor(model.entries, date)),
                ),
              ],
            ),
            h.footer(
              [
                h.Class(
                  "mt-7 flex items-center justify-between font-note text-[10px] tracking-[.1em] text-muted uppercase",
                ),
              ],
              [
                h.span(
                  [],
                  [
                    model.loadState === "loading"
                      ? "Refreshing the month"
                      : "One page for every day",
                  ],
                ),
                h.span([], [model.session === null ? "Access check pending" : "Private archive"]),
              ],
            ),
          ],
        ),
      ],
    ),
  };
};
