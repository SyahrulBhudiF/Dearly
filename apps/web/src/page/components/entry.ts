import { Html } from "foldkit";
import { FileDrop } from "@foldkit/ui";
import { Option } from "effect";
import { canvasDropZone, canvasElement } from "../../core/canvasDrag";
import type { Sticker } from "@dearly/domain";
import type { AppMessage } from "../../core/message";
import {
  ChangedRoute,
  ChangedText,
  DiscardedDraft,
  FinishedResize,
  GotFileDropMessage,
  ResizedCanvasElement,
  SaveRequested,
  StartedResize,
  SelectedSticker,
  ToggledStickerPicker,
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

export const toolRail = (
  h: HtmlFactory,
  stickerPickerOpen: boolean,
  stickers: ReadonlyArray<Sticker>,
) =>
  h.nav(
    [h.Class("flex gap-2 lg:flex-col")],
    [
      h.button(
        [
          h.AriaLabel("Text"),
          h.Class(
            "grid size-11 place-items-center rounded-full border border-line bg-paper font-display text-lg hover:border-wine hover:text-wine",
          ),
        ],
        ["T"],
      ),
      h.button(
        [
          h.OnClick(ToggledStickerPicker()),
          h.AriaLabel("Sticker"),
          h.AriaExpanded(stickerPickerOpen),
          h.Class(
            "grid size-11 place-items-center rounded-full border border-line bg-paper font-display text-lg hover:border-wine hover:text-wine",
          ),
        ],
        ["✦"],
      ),
      stickerPickerOpen
        ? h.div(
            [
              h.Class(
                "absolute z-10 mt-14 grid grid-cols-2 gap-2 border border-line bg-paper p-2 sm:grid-cols-3",
              ),
            ],
            stickers.map((sticker) =>
              h.button(
                [
                  h.OnClick(SelectedSticker({ sticker })),
                  h.AriaLabel(`Add ${sticker.label}`),
                  h.Class("size-11 overflow-hidden border border-line hover:border-wine"),
                ],
                [
                  h.img([
                    h.Src(`/media/${sticker.mediaObjectId}`),
                    h.Alt(sticker.label),
                    h.Class("size-full object-cover"),
                  ]),
                ],
              ),
            ),
          )
        : null,
      h.button(
        [
          h.AriaLabel("Move"),
          h.Class(
            "grid size-11 place-items-center rounded-full border border-line bg-paper font-display text-lg hover:border-wine hover:text-wine",
          ),
        ],
        ["↗"],
      ),
    ],
  );

export const canvasShell = (
  h: HtmlFactory,
  text: string,
  fileDrop: FileDrop.Model,
  imageMediaObjectId: string | null,
  imagePosition: { readonly x: number; readonly y: number },
  imageSize: { readonly width: number; readonly height: number },
  stickerMediaObjectId: string | null,
  stickerPosition: { readonly x: number; readonly y: number },
  stickerSize: { readonly width: number; readonly height: number },
  uploadState: "idle" | "uploading" | "failed",
) =>
  h.div(
    [
      h.OnMount({ name: "canvas-drop-zone", f: canvasDropZone }),
      h.OnPointerMove((screenX, screenY) =>
        Option.some(ResizedCanvasElement({ screenX, screenY })),
      ),
      h.OnPointerUp(() => Option.some(FinishedResize())),
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
        ? h.submodel({
            slotId: "entry-media-drop",
            model: fileDrop,
            view: FileDrop.view,
            toParentMessage: (message) => GotFileDropMessage({ message }),
            viewInputs: {
              accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
              toView: ({ root, input }) =>
                h.label(
                  [
                    ...root,
                    h.Class(
                      "relative mb-6 flex min-h-28 max-w-lg cursor-pointer items-center justify-center border border-dashed border-line px-4 py-5 text-center font-note text-[10px] tracking-[.1em] text-muted uppercase transition-colors hover:border-wine data-[drag-over=true]:border-wine data-[drag-over=true]:bg-rose/20",
                    ),
                  ],
                  [
                    "Drop an image here or ",
                    h.span([h.Class("text-wine")], ["choose a file"]),
                    h.input([...input, h.AriaLabel("Add entry image")]),
                  ],
                ),
            },
          })
        : null,
      imageMediaObjectId === null
        ? null
        : canvasImage(h, "image", imageMediaObjectId, "Entry image", imagePosition, imageSize),
      stickerMediaObjectId === null
        ? null
        : canvasImage(
            h,
            "sticker",
            stickerMediaObjectId,
            "Entry sticker",
            stickerPosition,
            stickerSize,
          ),
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

const canvasImage = (
  h: HtmlFactory,
  id: string,
  mediaObjectId: string,
  alt: string,
  position: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number },
) =>
  h.div(
    [
      h.OnMount({ name: `canvas-${id}`, f: (element) => canvasElement(id, position, element) }),
      h.Style({
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }),
      h.Class("cursor-move touch-none"),
    ],
    [
      h.img([h.Src(`/media/${mediaObjectId}`), h.Alt(alt), h.Class("size-full object-contain")]),
      h.button(
        [
          h.OnPointerDown((_pointerType, _button, screenX, screenY) =>
            Option.some(StartedResize({ id, screenX, screenY, ...size })),
          ),
          h.AriaLabel(`Resize ${alt}`),
          h.Class("absolute right-0 bottom-0 size-5 cursor-nwse-resize border border-ink bg-paper"),
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
