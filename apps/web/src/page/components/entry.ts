import { Html } from "foldkit";
import { Button, FileDrop, Textarea } from "@foldkit/ui";
import { ArrowLeft, ArrowUpRight, Sparkles, Type } from "lucide";
import { Option } from "effect";
import type { CanvasElement, Sticker } from "@dearly/domain";
import { canvasDropZone, canvasElement } from "../../core/canvasDrag";
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
import { icon } from "./icon";

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
          Button.view<AppMessage>({
            onClick: DiscardedDraft(),
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
            onClick: SaveRequested(),
            isDisabled: saveState === "saving",
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    "border border-ink bg-ink px-4 py-2 font-note text-[10px] tracking-[.14em] text-paper hover:bg-wine disabled:cursor-wait disabled:bg-muted uppercase",
                  ),
                ],
                [saveState === "saving" ? "Saving…" : "Save entry"],
              ),
          }),
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
      toolButton(h, "Text", icon(h, Type, "Text")),
      Button.view<AppMessage>({
        onClick: ToggledStickerPicker(),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaLabel("Sticker"),
              h.AriaExpanded(stickerPickerOpen),
              h.Class(
                "grid size-11 place-items-center rounded-full border border-line bg-paper hover:border-wine hover:text-wine",
              ),
            ],
            [icon(h, Sparkles, "Sticker")],
          ),
      }),
      stickerPickerOpen
        ? h.div(
            [
              h.Class(
                "absolute z-10 mt-14 grid grid-cols-2 gap-2 border border-line bg-paper p-2 sm:grid-cols-3",
              ),
            ],
            stickers.map((sticker) =>
              Button.view<AppMessage>({
                onClick: SelectedSticker({ sticker }),
                toView: ({ button }) =>
                  h.button(
                    [
                      ...button,
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
              }),
            ),
          )
        : null,
      toolButton(h, "Move", icon(h, ArrowUpRight, "Move")),
    ],
  );

export const canvasShell = (
  h: HtmlFactory,
  text: string,
  fileDrop: FileDrop.Model,
  elements: ReadonlyArray<CanvasElement>,
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
      h.submodel({
        slotId: "entry-media-drop",
        model: fileDrop,
        view: FileDrop.view,
        toParentMessage: (message) => GotFileDropMessage({ message }),
        viewInputs: {
          accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          multiple: true,
          toView: ({ root, input }) =>
            h.label(
              [
                ...root,
                h.Class(
                  "relative mb-6 flex min-h-28 max-w-lg cursor-pointer items-center justify-center border border-dashed border-line px-4 py-5 text-center font-note text-[10px] tracking-[.1em] text-muted uppercase transition-colors hover:border-wine data-[drag-over=true]:border-wine data-[drag-over=true]:bg-rose/20",
                ),
              ],
              [
                "Drop images here or ",
                h.span([h.Class("text-wine")], ["choose files"]),
                h.input([...input, h.AriaLabel("Add entry images")]),
              ],
            ),
        },
      }),
      ...[...elements].sort((a, b) => a.layer - b.layer).map((element) => canvasMedia(h, element)),
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
      Textarea.view({
        id: "entry-text",
        value: text,
        rows: 14,
        placeholder: "What deserves a place on this page?",
        onInput: (value) => ChangedText({ text: value }),
        toView: ({ textarea }) =>
          h.textarea(
            [
              ...textarea,
              h.Class(
                "relative block w-full max-w-xl resize-none bg-transparent font-display text-2xl leading-tight placeholder:text-muted/70 focus:outline-none sm:text-3xl",
              ),
              h.AriaLabel("Diary entry"),
            ],
            [],
          ),
      }),
    ],
  );

const canvasMedia = (h: HtmlFactory, element: CanvasElement) => {
  if (element.payload.kind === "text") return null;
  const alt =
    element.payload.kind === "image" ? (element.payload.alt ?? "Entry image") : "Entry sticker";
  return h.keyed("div")(
    element.id,
    [
      h.OnMount({
        name: `canvas-${element.id}`,
        f: (node) => canvasElement(element.id, element, node),
      }),
      h.Style({
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
      }),
      h.Class("cursor-move touch-none"),
    ],
    [
      h.img([
        h.Src(`/media/${element.payload.mediaObjectId}`),
        h.Alt(alt),
        h.Class("size-full object-contain"),
      ]),
      Button.view<AppMessage>({
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.OnPointerDown((_pointerType, _button, screenX, screenY) =>
                Option.some(
                  StartedResize({
                    id: element.id,
                    screenX,
                    screenY,
                    width: element.width,
                    height: element.height,
                  }),
                ),
              ),
              h.AriaLabel(`Resize ${alt}`),
              h.Class(
                "absolute right-0 bottom-0 size-5 cursor-nwse-resize border border-ink bg-paper",
              ),
            ],
            [],
          ),
      }),
    ],
  );
};

const toolButton = (h: HtmlFactory, label: string, content: ReturnType<typeof icon>) =>
  Button.view<AppMessage>({
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaLabel(label),
          h.Class(
            "grid size-11 place-items-center rounded-full border border-line bg-paper hover:border-wine hover:text-wine",
          ),
        ],
        [content],
      ),
  });

export const calendarLink = (h: HtmlFactory) =>
  Button.view<AppMessage>({
    onClick: ChangedRoute({ route: CalendarRoute() }),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.Class(
            "flex items-center gap-1 font-note text-[11px] tracking-[.1em] text-muted hover:text-wine uppercase",
          ),
        ],
        [icon(h, ArrowLeft, "Calendar"), "Calendar"],
      ),
  });
