import { Html } from "foldkit";
import type { AppMessage } from "../../core/message";
import {
  ChangedRoute,
  ChangedText,
  DiscardedDraft,
  SaveRequested,
  SelectedImage,
} from "../../core/message";
import { CalendarRoute } from "../../core/route";
import { dateLabel, weekdayLabel } from "../../libs/date";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const entryHeader = (
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
          h.button(
            [
              h.OnClick(DiscardedDraft()),
              h.Class(
                "font-note text-[10px] tracking-[.12em] text-muted hover:text-wine uppercase",
              ),
            ],
            ["Discard"],
          ),
          h.button(
            [
              h.OnClick(SaveRequested()),
              h.Disabled(saveState === "saving"),
              h.Class(
                "border border-ink bg-ink px-4 py-2 font-note text-[10px] tracking-[.14em] text-paper hover:bg-wine disabled:cursor-wait disabled:bg-muted uppercase",
              ),
            ],
            [saveState === "saving" ? "Saving…" : "Save entry"],
          ),
        ],
      ),
    ],
  );

export const toolRail = (h: HtmlFactory) =>
  h.nav(
    [h.Class("flex gap-2 lg:flex-col")],
    [
      ["T", "Text"],
      ["✦", "Sticker"],
      ["↗", "Move"],
    ].map(([symbol, label]) =>
      h.button(
        [
          h.AriaLabel(label!),
          h.Class(
            "grid size-11 place-items-center rounded-full border border-line bg-paper font-display text-lg hover:border-wine hover:text-wine",
          ),
        ],
        [symbol!],
      ),
    ),
  );

export const canvasShell = (
  h: HtmlFactory,
  text: string,
  imageMediaObjectId: string | null,
  uploadState: "idle" | "uploading" | "failed",
) =>
  h.div(
    [
      h.Class(
        "relative min-h-[55vh] overflow-hidden border border-line bg-canvas p-5 sm:min-h-[60vh] sm:p-12",
      ),
    ],
    [
      h.div(
        [
          h.Class(
            "pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:28px_28px]",
          ),
        ],
        [],
      ),
      imageMediaObjectId === null
        ? h.div(
            [
              h.AllowDrop(),
              h.OnDropFiles((files) => SelectedImage({ file: files[0]! })),
              h.Class(
                "relative mb-6 flex min-h-28 max-w-lg items-center justify-center border border-dashed border-line px-4 py-5 text-center transition-colors hover:border-wine",
              ),
            ],
            [
              h.label(
                [
                  h.Class(
                    "cursor-pointer font-note text-[10px] tracking-[.1em] text-muted uppercase",
                  ),
                ],
                [
                  "Drop an image here or ",
                  h.span([h.Class("text-wine")], ["choose a file"]),
                  h.input([
                    h.Type("file"),
                    h.Accept("image/jpeg,image/png,image/webp,image/gif"),
                    h.OnFileChange((files) => SelectedImage({ file: files[0]! })),
                    h.AriaLabel("Add entry image"),
                    h.Class("sr-only"),
                  ]),
                ],
              ),
            ],
          )
        : null,
      imageMediaObjectId === null
        ? null
        : h.img([
            h.Src(`/media/${imageMediaObjectId}`),
            h.Alt("Entry image"),
            h.Class("relative mb-6 max-h-80 w-full max-w-lg object-cover"),
          ]),
      uploadState === "uploading"
        ? h.p(
            [h.Class("relative mb-4 font-note text-[10px] text-muted uppercase")],
            ["Uploading image…"],
          )
        : uploadState === "failed"
          ? h.p(
              [h.Class("relative mb-4 font-note text-[10px] text-wine uppercase")],
              ["Image upload failed"],
            )
          : null,
      h.textarea(
        [
          h.OnInput((value) => ChangedText({ text: value })),
          h.Value(text),
          h.Placeholder("What deserves a place on this page?"),
          h.Rows(14),
          h.Class(
            "relative block w-full max-w-xl resize-none bg-transparent font-display text-2xl leading-tight placeholder:text-muted/70 focus:outline-none sm:text-3xl",
          ),
          h.AriaLabel("Diary entry"),
        ],
        [],
      ),
    ],
  );

export const calendarLink = (h: HtmlFactory) =>
  h.button(
    [
      h.OnClick(ChangedRoute({ route: CalendarRoute() })),
      h.Class("font-note text-[11px] tracking-[.1em] text-muted hover:text-wine uppercase"),
    ],
    ["← Calendar"],
  );
