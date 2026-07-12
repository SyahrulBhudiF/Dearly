import { Html } from "foldkit";
import { Button, Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import EmojiConvertor from "emoji-js";
import { ImageUp, Sparkles, Type } from "lucide";
import type { CanvasElement, MediaObject, Sticker } from "@dearly/domain";
import { canvasDropZone } from "../../core/canvasDrag";
import type { AppMessage } from "../../core/message";
import {
  AddedTextCanvasElement,
  ChangedEmojiSearch,
  ChangedImageSearch,
  ChangedStickerSearch,
  GotEmojiListMessage,
  GotFileDropMessage,
  GotImagePopoverMessage,
  GotStickerFileDropMessage,
  GotStickerPopoverMessage,
  SelectedEmoji,
  SelectedStickerTab,
  SelectedStoredImage,
  SelectedSticker,
} from "../../core/message";
import { icon } from "./icon";
import { CanvasItem } from "./element";
import { DeleteDialog } from "./dialog";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

const emoji = new EmojiConvertor();
emoji.replace_mode = "unified";
emoji.allow_native = true;
const faceEmojiNames = new Set([
  "grinning",
  "smiley",
  "smile",
  "grin",
  "laughing",
  "sweat_smile",
  "joy",
  "rofl",
  "relaxed",
  "wink",
  "blush",
  "heart_eyes",
  "kissing_heart",
  "yum",
  "stuck_out_tongue",
  "sunglasses",
  "thinking",
  "neutral_face",
  "expressionless",
  "unamused",
  "sweat",
  "pensive",
  "confused",
  "upside_down",
  "cry",
  "sob",
  "angry",
  "rage",
  "fearful",
  "scream",
  "sleeping",
]);

const emojis = Object.values(emoji.data)
  .map(([unified, , , names]) => ({ value: unified[0], name: (names as ReadonlyArray<string>)[0] }))
  .filter(
    (item): item is { readonly value: string; readonly name: string } =>
      item.value !== undefined && item.name !== undefined,
  )
  .sort(
    (left, right) => Number(faceEmojiNames.has(right.name)) - Number(faceEmojiNames.has(left.name)),
  );

export const toolRail = (
  h: HtmlFactory,
  imagePopover: Popover.Model,
  images: ReadonlyArray<MediaObject>,
  imageSearch: string,
  stickerPopover: Popover.Model,
  stickers: ReadonlyArray<Sticker>,
  stickerSearch: string,
  stickerTab: "stickers" | "emoji",
  emojiSearch: string,
  emojiList: VirtualList.Model,
  stickerFileDrop: FileDrop.Model,
  fileDrop: FileDrop.Model,
) =>
  h.nav(
    [h.Class("flex gap-2 lg:flex-col")],
    [
      toolButton(h, "Text", icon(h, Type, "Text"), AddedTextCanvasElement()),
      imagePicker(h, imagePopover, images, imageSearch, fileDrop),
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
                              "z-20 w-72 rounded-[var(--radius)] border border-line bg-popover p-3 shadow-[var(--shadow)]",
                            ),
                          ],
                          [
                            stickerTabs(h, stickerTab),
                            stickerTab === "stickers"
                              ? h.div(
                                  [h.Class("mt-3 grid grid-cols-4 justify-items-center gap-2")],
                                  [
                                    searchInput(h, "Search stickers", stickerSearch, (value) =>
                                      ChangedStickerSearch({ value }),
                                    ),
                                    h.submodel({
                                      slotId: "sticker-media-upload",
                                      model: stickerFileDrop,
                                      view: FileDrop.view,
                                      toParentMessage: (message) =>
                                        GotStickerFileDropMessage({ message }),
                                      viewInputs: {
                                        accept: [
                                          "image/jpeg",
                                          "image/png",
                                          "image/webp",
                                          "image/gif",
                                        ],
                                        multiple: true,
                                        toView: ({ root, input }) =>
                                          h.label(
                                            [
                                              ...root,
                                              h.Class(
                                                "col-span-full mb-1 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] bg-secondary px-3 py-2 font-note text-xs text-secondary-foreground",
                                              ),
                                            ],
                                            [
                                              icon(h, ImageUp, "Upload sticker"),
                                              "Upload sticker",
                                              h.input([...input, h.Class("sr-only")]),
                                            ],
                                          ),
                                      },
                                    }),
                                    ...stickerItems(h, stickers, stickerSearch),
                                  ],
                                )
                              : emojiPicker(h, emojiSearch, emojiList),
                          ],
                        ),
                      ],
                    )
                  : null,
              ],
            ),
        },
      }),
    ],
  );

const stickerTabs = (h: HtmlFactory, selectedTab: "stickers" | "emoji") =>
  h.div(
    [h.Class("grid grid-cols-2 rounded-[var(--radius)] bg-primary p-1")],
    (["stickers", "emoji"] as const).map((tab) =>
      Button.view<AppMessage>({
        onClick: SelectedStickerTab({ tab }),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.Class(
                `min-w-0 rounded-[calc(var(--radius)-0.25rem)] px-3 py-1.5 font-note text-xs capitalize ${selectedTab === tab ? "bg-card text-ink shadow-sm" : "text-primary-foreground"}`,
              ),
            ],
            [tab === "stickers" ? "Stickers" : "Emoji"],
          ),
      }),
    ),
  );

const stickerItems = (h: HtmlFactory, stickers: ReadonlyArray<Sticker>, search: string) => {
  const matchingStickers = stickers.filter((sticker) =>
    sticker.label.toLowerCase().includes(search.toLowerCase()),
  );
  return matchingStickers.length === 0
    ? [
        h.p(
          [h.Class("col-span-full p-4 font-note text-xs text-muted-foreground")],
          ["No stickers yet."],
        ),
      ]
    : matchingStickers.map((sticker) =>
        Button.view<AppMessage>({
          onClick: SelectedSticker({ sticker }),
          toView: ({ button }) =>
            h.button(
              [
                ...button,
                h.AriaLabel(`Add ${sticker.label}`),
                h.Class(
                  "size-11 overflow-hidden rounded-[var(--radius)] border border-line hover:border-wine",
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
      );
};

const emojiPicker = (h: HtmlFactory, search: string, emojiList: VirtualList.Model) => {
  const filtered = emojis.filter((item) => item.name.includes(search.toLowerCase()));
  const rows = Array.from({ length: Math.ceil(filtered.length / 4) }, (_, index) =>
    filtered.slice(index * 4, index * 4 + 4),
  );
  return h.div(
    [h.Class("mt-3")],
    [
      searchInput(h, "Search emoji", search, (value) => ChangedEmojiSearch({ value })),
      h.submodel({
        slotId: "emoji-picker-list",
        model: emojiList,
        view: VirtualList.view<ReadonlyArray<(typeof emojis)[number]>>(),
        toParentMessage: (message) => GotEmojiListMessage({ message }),
        viewInputs: {
          items: rows,
          itemToKey: (_row, index) => String(index),
          itemToView: (row) =>
            h.div(
              [h.Class("grid grid-cols-4 justify-items-center gap-2")],
              row.map((item) => emojiButton(h, item.value, item.name)),
            ),
          containerClassName: "h-60 w-full pr-1",
        },
      }),
    ],
  );
};

const emojiButton = (h: HtmlFactory, value: string, name: string) =>
  Button.view<AppMessage>({
    onClick: SelectedEmoji({ emoji: value }),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaLabel(`Add ${name}`),
          h.Class(
            "grid size-11 place-items-center rounded-[var(--radius)] border border-line text-2xl hover:bg-accent",
          ),
        ],
        [value],
      ),
  });

const searchInput = (
  h: HtmlFactory,
  placeholder: string,
  value: string,
  toMessage: (value: string) => AppMessage,
) =>
  h.input([
    h.Type("search"),
    h.Value(value),
    h.Placeholder(placeholder),
    h.AriaLabel(placeholder),
    h.OnInput(toMessage),
    h.Class(
      "mb-2 box-border block w-full min-w-0 rounded-[var(--radius)] border border-line bg-card px-3 py-2 font-note text-xs text-ink placeholder:text-muted-foreground focus:border-primary focus:outline-none",
    ),
  ]);

const imagePicker = (
  h: HtmlFactory,
  imagePopover: Popover.Model,
  images: ReadonlyArray<MediaObject>,
  search: string,
  fileDrop: FileDrop.Model,
) =>
  h.submodel({
    slotId: "image-picker",
    model: imagePopover,
    view: Popover.view,
    toParentMessage: (message) => GotImagePopoverMessage({ message }),
    viewInputs: {
      anchor: { placement: "right-start", gap: 8 },
      ariaLabel: "Choose image",
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
              [icon(h, ImageUp, "Image")],
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
                          "z-20 w-72 rounded-[var(--radius)] border border-line bg-popover p-3 shadow-[var(--shadow)]",
                        ),
                      ],
                      [
                        searchInput(h, "Search images", search, (value) =>
                          ChangedImageSearch({ value }),
                        ),
                        h.submodel({
                          slotId: "entry-media-upload",
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
                                    "mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-3 py-2 font-note text-xs text-primary-foreground",
                                  ),
                                ],
                                [
                                  icon(h, ImageUp, "Upload image"),
                                  "Upload image",
                                  h.input([...input, h.Class("sr-only")]),
                                ],
                              ),
                          },
                        }),
                        images.filter((image) =>
                          image.name.toLowerCase().includes(search.toLowerCase()),
                        ).length === 0
                          ? h.p(
                              [h.Class("py-5 text-center font-note text-xs text-muted-foreground")],
                              ["No uploaded images."],
                            )
                          : h.div(
                              [h.Class("grid max-h-64 grid-cols-3 gap-2 overflow-y-auto")],
                              images
                                .filter((image) =>
                                  image.name.toLowerCase().includes(search.toLowerCase()),
                                )
                                .map((image) =>
                                  Button.view<AppMessage>({
                                    onClick: SelectedStoredImage({ mediaObjectId: image.id }),
                                    toView: ({ button: imageButton }) =>
                                      h.button(
                                        [
                                          ...imageButton,
                                          h.AriaLabel(`Add ${image.name}`),
                                          h.Class(
                                            "aspect-square overflow-hidden rounded-[var(--radius)] border border-line hover:border-wine",
                                          ),
                                        ],
                                        [
                                          h.img([
                                            h.Src(`/media/${image.id}`),
                                            h.Alt(image.name),
                                            h.Class("size-full object-cover"),
                                          ]),
                                        ],
                                      ),
                                  }),
                                ),
                            ),
                      ],
                    ),
                  ],
                )
              : null,
          ],
        ),
    },
  });

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

const toolButton = (
  h: HtmlFactory,
  label: string,
  content: ReturnType<typeof icon>,
  onClick?: AppMessage,
) =>
  Button.view<AppMessage>({
    ...(onClick === undefined ? {} : { onClick }),
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
