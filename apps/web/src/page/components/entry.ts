import { Html } from "foldkit";
import { Button, Dialog, FileDrop, Popover } from "@foldkit/ui";
import { ArrowUpRight, Sparkles, Type } from "lucide";
import { Option } from "effect";
import type { CanvasElement, Sticker } from "@dearly/domain";
import { canvasDropZone } from "../../core/canvasDrag";
import type { AppMessage } from "../../core/message";
import {
  FinishedResize,
  GotFileDropMessage,
  GotStickerPopoverMessage,
  ResizedCanvasElement,
  SelectedSticker,
} from "../../core/message";
import { icon } from "./icon";
import { CanvasItem } from "./element";
import { DeleteDialog } from "./dialog";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const toolRail = (
  h: HtmlFactory,
  stickerPopover: Popover.Model,
  stickers: ReadonlyArray<Sticker>,
) =>
  h.nav(
    [h.Class("flex gap-2 lg:flex-col")],
    [
      toolButton(h, "Text", icon(h, Type, "Text")),
      h.submodel({
        slotId: "sticker-picker",
        model: stickerPopover,
        view: Popover.view,
        toParentMessage: (message) => GotStickerPopoverMessage({ message }),
        viewInputs: {
          anchor: { placement: "right-start", gap: 8 },
          ariaLabel: "Choose sticker",
          toView: ({ button, panel, backdrop, isVisible }) =>
            h.div(
              [],
              [
                h.button(
                  [
                    ...button,
                    h.Class(
                      "grid size-11 place-items-center rounded-full border border-line bg-paper hover:border-wine hover:text-wine",
                    ),
                  ],
                  [icon(h, Sparkles, "Sticker")],
                ),
                isVisible
                  ? h.div(
                      [],
                      [
                        h.div([...backdrop, h.Class("fixed inset-0 z-10")], []),
                        h.div(
                          [
                            ...panel,
                            h.Class(
                              "z-20 grid grid-cols-2 gap-2 border border-line bg-paper p-2 sm:grid-cols-3",
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
                                    h.Class(
                                      "size-11 overflow-hidden border border-line hover:border-wine",
                                    ),
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
                        ),
                      ],
                    )
                  : null,
              ],
            ),
        },
      }),
      toolButton(h, "Move", icon(h, ArrowUpRight, "Move")),
    ],
  );

export const canvasShell = (
  h: HtmlFactory,
  text: string,
  fileDrop: FileDrop.Model,
  elements: ReadonlyArray<CanvasElement>,
  selectedElementId: string | null,
  deleteDialog: Dialog.Model,
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
      ...[...elements]
        .sort((a, b) => a.layer - b.layer)
        .map((element) => CanvasItem(h, element, selectedElementId, text)),
      DeleteDialog(h, deleteDialog),
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
    ],
  );

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
