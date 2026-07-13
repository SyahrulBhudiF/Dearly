import { Button } from "@foldkit/ui";
import { Html } from "foldkit";
import type { AppMessage } from "../../core/app/message";
import { GotEntryMessage } from "../../core/app/message";
import { DiscardedDraft, SaveRequested } from "../../core/entry/message";
import { dateLabel, weekdayLabel } from "../../libs/date";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const EntryHeader = (
  h: HtmlFactory,
  date: string,
  saveState: "idle" | "saving" | "failed",
) =>
  h.div(
    [h.Class("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between")],
    [
      h.div(
        [],
        [
          h.p(
            [h.Class("font-note text-[10px] tracking-[.15em] text-muted uppercase")],
            [weekdayLabel(date)],
          ),
          h.h1([h.Class("mt-1 font-display text-4xl sm:text-5xl")], [dateLabel(date)]),
        ],
      ),
      h.div(
        [h.Class("flex items-center gap-3")],
        [
          Button.view<AppMessage>({
            onClick: GotEntryMessage({ message: DiscardedDraft() }),
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    "font-note text-[10px] tracking-[.12em] text-muted hover:text-wine uppercase",
                  ),
                ],
                ["Discard"],
              ),
          }),
          Button.view<AppMessage>({
            onClick: GotEntryMessage({ message: SaveRequested() }),
            isDisabled: saveState === "saving",
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    "rounded-[var(--radius)] border border-primary bg-primary px-4 py-2 font-note text-[10px] tracking-[.14em] text-primary-foreground shadow-[var(--shadow)] hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:bg-muted uppercase",
                  ),
                ],
                [saveState === "saving" ? "Saving…" : "Save entry"],
              ),
          }),
        ],
      ),
    ],
  );
