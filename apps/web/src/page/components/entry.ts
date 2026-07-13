import { Option, Stream } from "effect";
import { Html } from "foldkit";
import { Button, Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import EmojiConvertor from "emoji-js";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  GripVertical,
  ImageUp,
  Layers3,
  Shapes,
  Sparkles,
  Type,
} from "lucide";
import type { ShapeKind } from "@dearly/domain";
import type { CanvasElement, MediaObject, Sticker } from "@dearly/domain";
import type { AppMessage } from "../../core/app/message";
import { GotCanvasMessage, GotMediaMessage } from "../../core/app/message";
import type { Model as CanvasModel } from "../../core/canvas/model";
import type { Model as MediaModel } from "../../core/media/model";
import {
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
} from "../../core/media/message";
import {
  AddedShape,
  AddedTextCanvasElement,
  ChangedShapeColor,
  DeselectedCanvasElement,
  MovedCanvasElementLayer,
  SelectedCanvasElement,
  ToggledLayersPanel,
  ToggledShapePicker,
} from "../../core/canvas/message";
import { canvasPaste } from "../../core/canvas/drag";
import { sortableLayers } from "../../core/canvas/layers";
import { icon } from "./icon";
import { CanvasItem } from "./element";
import { DeleteDialog } from "./dialog";
import { UploadDialog } from "./uploadDialog";

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
  .map(([unified, , , names]) => ({
    value: unified[0],
    name: (names as ReadonlyArray<string>)[0],
  }))
  .filter(
    (item): item is { readonly value: string; readonly name: string } =>
      item.value !== undefined && item.name !== undefined,
  )
  .sort(
    (left, right) => Number(faceEmojiNames.has(right.name)) - Number(faceEmojiNames.has(left.name)),
  );

export const toolRail = (h: HtmlFactory, mediaModel: MediaModel, canvasModel: CanvasModel) => {
  const {
    imagePopover,
    images,
    imageSearch,
    stickerPopover,
    stickers,
    stickerSearch,
    stickerTab,
    emojiSearch,
    emojiList,
    stickerFileDrop,
    fileDrop,
  } = mediaModel;
  return h.nav(
    [h.Class("flex gap-2 lg:flex-col")],
    [
      toolButton(h, "Text", icon(h, Type, "Text"), canvas(AddedTextCanvasElement())),
      imagePicker(h, imagePopover, images, imageSearch, fileDrop),
      shapePicker(h, canvasModel),
      layersPicker(h, canvasModel),
      h.submodel({
        slotId: "sticker-picker",
        model: stickerPopover,
        view: Popover.view,
        toParentMessage: (message) => media(GotStickerPopoverMessage({ message })),
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
                                      media(ChangedStickerSearch({ value })),
                                    ),
                                    h.submodel({
                                      slotId: "sticker-media-upload",
                                      model: stickerFileDrop,
                                      view: FileDrop.view,
                                      toParentMessage: (message) =>
                                        media(GotStickerFileDropMessage({ message })),
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
};

const layersPicker = (h: HtmlFactory, model: CanvasModel) => {
  const layers = [...model.elements].sort((a, b) => b.layer - a.layer);
  return h.div(
    [h.Class("relative")],
    [
      toolButton(h, "Layers", icon(h, Layers3, "Layers"), canvas(ToggledLayersPanel())),
      model.layersPanelOpen
        ? h.div(
            [
              h.OnClick(canvas(ToggledLayersPanel())),
              h.AriaHidden(true),
              h.Class("fixed inset-0 z-20"),
            ],
            [],
          )
        : null,
      model.layersPanelOpen
        ? h.aside(
            [
              h.OnMount({
                name: "canvas-layers-sortable",
                f: (node) => sortableLayers(node).pipe(Stream.map(canvas)),
              }),
              h.AriaLabel("Canvas layers"),
              h.Class(
                "absolute top-0 left-14 z-30 w-72 overflow-hidden rounded-[var(--radius)] border border-line bg-popover shadow-[var(--shadow)]",
              ),
            ],
            [
              h.div(
                [h.Class("flex items-center justify-between border-b border-line px-4 py-3")],
                [
                  h.div(
                    [],
                    [
                      h.p([h.Class("font-display text-lg leading-none")], ["Layers"]),
                      h.p(
                        [h.Class("mt-1 font-note text-[10px] text-muted")],
                        ["Drag to arrange front to back"],
                      ),
                    ],
                  ),
                  h.span(
                    [
                      h.Class(
                        "rounded-full bg-primary px-2 py-1 font-note text-[10px] text-primary-foreground",
                      ),
                    ],
                    [String(layers.length)],
                  ),
                ],
              ),
              layers.length === 0
                ? h.p(
                    [h.Class("px-4 py-8 text-center font-note text-xs text-muted")],
                    ["Canvas is empty."],
                  )
                : h.ol(
                    [h.Class("max-h-80 divide-y divide-line overflow-y-auto p-2")],
                    layers.map((element) => layerRow(h, element, model)),
                  ),
            ],
          )
        : null,
    ],
  );
};

const layerRow = (h: HtmlFactory, element: CanvasElement, model: CanvasModel) => {
  const selected = model.selectedElementId === element.id;
  const label = layerLabel(element);
  return h.keyed("li")(
    element.id,
    [
      h.DataAttribute("layer-id", element.id),
      h.Class(
        `group flex items-center gap-2 rounded-[calc(var(--radius)-0.4rem)] px-2 py-2 transition-colors duration-150 ${selected ? "bg-rose/35" : "hover:bg-card"}`,
      ),
    ],
    [
      h.button(
        [
          h.DataAttribute("layer-handle", "true"),
          h.AriaLabel(`Drag ${label} layer`),
          h.Class(
            "grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted active:cursor-grabbing active:scale-[.97]",
          ),
        ],
        [icon(h, GripVertical, `Drag ${label} layer`)],
      ),
      h.button(
        [
          h.OnClick(canvas(SelectedCanvasElement({ id: element.id }))),
          h.AriaPressed(String(selected)),
          h.Class("flex min-w-0 grow items-center gap-3 text-left active:scale-[.99]"),
        ],
        [
          layerThumbnail(h, element),
          h.span(
            [h.Class("min-w-0")],
            [
              h.span([h.Class("block truncate font-note text-sm text-ink")], [label]),
              h.span(
                [h.Class("block font-note text-[10px] text-muted")],
                [`Layer ${element.layer + 1}`],
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class("flex shrink-0")],
        [
          h.button(
            [
              h.OnClick(canvas(MovedCanvasElementLayer({ id: element.id, edge: "front" }))),
              h.AriaLabel(`Move ${label} to front`),
              h.Title("Move to front"),
              h.Class(
                "grid size-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-wine",
              ),
            ],
            [icon(h, ArrowUpToLine, "Move to front")],
          ),
          h.button(
            [
              h.OnClick(canvas(MovedCanvasElementLayer({ id: element.id, edge: "back" }))),
              h.AriaLabel(`Move ${label} to back`),
              h.Title("Move to back"),
              h.Class(
                "grid size-7 place-items-center rounded-md text-muted hover:bg-paper hover:text-wine",
              ),
            ],
            [icon(h, ArrowDownToLine, "Move to back")],
          ),
        ],
      ),
    ],
  );
};

const layerThumbnail = (h: HtmlFactory, element: CanvasElement) =>
  h.span(
    [
      h.Class(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-[7px] border border-line bg-canvas font-display text-sm",
      ),
    ],
    [
      element.payload.kind === "image" ||
      (element.payload.kind === "sticker" && element.payload.emoji === undefined)
        ? h.img([
            h.Src(`/media/${element.payload.mediaObjectId}`),
            h.Alt(""),
            h.Class("size-full object-cover"),
          ])
        : element.payload.kind === "sticker"
          ? (element.payload.emoji ?? "")
          : element.payload.kind === "shape"
            ? shapePreview(h, element.payload.shape, element.payload.color)
            : "T",
    ],
  );

const layerLabel = (element: CanvasElement) =>
  element.payload.kind === "text"
    ? "Text"
    : element.payload.kind === "image"
      ? element.payload.alt?.trim() || "Image"
      : element.payload.kind === "shape"
        ? `${element.payload.shape[0]?.toUpperCase()}${element.payload.shape.slice(1)}`
        : element.payload.emoji === undefined
          ? "Sticker"
          : "Emoji";

const shapes: ReadonlyArray<{
  readonly kind: ShapeKind;
  readonly label: string;
}> = [
  { kind: "rectangle", label: "Rectangle" },
  { kind: "circle", label: "Circle" },
  { kind: "triangle", label: "Triangle" },
  { kind: "diamond", label: "Diamond" },
  { kind: "star", label: "Star" },
  { kind: "heart", label: "Heart" },
];

const shapeColors = [
  "var(--foreground)",
  "var(--primary)",
  "var(--secondary-foreground)",
  "var(--accent-foreground)",
  "#d98b7b",
  "#7d94a8",
] as const;

const shapePicker = (h: HtmlFactory, model: CanvasModel) =>
  h.div(
    [h.Class("relative")],
    [
      toolButton(h, "Shape", icon(h, Shapes, "Shape"), canvas(ToggledShapePicker())),
      model.shapePickerOpen
        ? h.div(
            [
              h.OnClick(canvas(ToggledShapePicker())),
              h.AriaHidden(true),
              h.Class("fixed inset-0 z-20"),
            ],
            [],
          )
        : null,
      model.shapePickerOpen
        ? h.div(
            [
              h.Class(
                "absolute top-0 left-14 z-30 w-64 rounded-[var(--radius)] border border-line bg-popover p-3 shadow-[var(--shadow)]",
              ),
            ],
            [
              h.p(
                [h.Class("mb-2 font-note text-[10px] tracking-[.12em] text-muted uppercase")],
                ["Shape"],
              ),
              h.div(
                [h.Class("grid grid-cols-3 gap-2")],
                shapes.map(({ kind, label }) =>
                  Button.view<AppMessage>({
                    onClick: canvas(AddedShape({ shape: kind })),
                    toView: ({ button }) =>
                      h.button(
                        [
                          ...button,
                          h.AriaLabel(`Add ${label}`),
                          h.Class(
                            "grid aspect-square place-items-center rounded-[calc(var(--radius)-0.4rem)] bg-card hover:bg-rose/30",
                          ),
                        ],
                        [shapePreview(h, kind, model.shapeColor)],
                      ),
                  }),
                ),
              ),
              h.p(
                [h.Class("mt-3 mb-2 font-note text-[10px] tracking-[.12em] text-muted uppercase")],
                ["Color"],
              ),
              h.div(
                [h.Class("flex gap-2")],
                shapeColors.map((color) =>
                  Button.view<AppMessage>({
                    onClick: canvas(ChangedShapeColor({ color })),
                    toView: ({ button }) =>
                      h.button(
                        [
                          ...button,
                          h.AriaLabel(`Use ${color} shape color`),
                          h.Style({ backgroundColor: color }),
                          h.Class(
                            `size-7 rounded-[6px] ${model.shapeColor === color ? "outline-2 outline-offset-2 outline-wine" : ""}`,
                          ),
                        ],
                        [],
                      ),
                  }),
                ),
              ),
            ],
          )
        : null,
    ],
  );

const shapePreview = (h: HtmlFactory, shape: ShapeKind, color: string) =>
  h.div([h.Style({ backgroundColor: color }), h.Class(`size-8 ${shapeClass(shape)}`)], []);

const shapeClass = (shape: ShapeKind) =>
  shape === "circle"
    ? "rounded-full"
    : shape === "triangle"
      ? "[clip-path:polygon(50%_0,100%_100%,0_100%)]"
      : shape === "diamond"
        ? "rotate-45 scale-75"
        : shape === "star"
          ? "[clip-path:polygon(50%_0,61%_35%,98%_35%,68%_57%,79%_91%,50%_70%,21%_91%,32%_57%,2%_35%,39%_35%)]"
          : shape === "heart"
            ? "[clip-path:polygon(50%_88%,8%_47%,8%_25%,22%_10%,39%_10%,50%_23%,61%_10%,78%_10%,92%_25%,92%_47%)]"
            : "rounded-[5px]";

const stickerTabs = (h: HtmlFactory, selectedTab: "stickers" | "emoji") =>
  h.div(
    [h.Class("grid grid-cols-2 rounded-[var(--radius)] bg-primary p-1")],
    (["stickers", "emoji"] as const).map((tab) =>
      Button.view<AppMessage>({
        onClick: media(SelectedStickerTab({ tab })),
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
          onClick: media(SelectedSticker({ sticker })),
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
      searchInput(h, "Search emoji", search, (value) => media(ChangedEmojiSearch({ value }))),
      h.submodel({
        slotId: "emoji-picker-list",
        model: emojiList,
        view: VirtualList.view<ReadonlyArray<(typeof emojis)[number]>>(),
        toParentMessage: (message) => media(GotEmojiListMessage({ message })),
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
    onClick: media(SelectedEmoji({ emoji: value })),
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
    toParentMessage: (message) => media(GotImagePopoverMessage({ message })),
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
                          media(ChangedImageSearch({ value })),
                        ),
                        h.submodel({
                          slotId: "entry-media-upload",
                          model: fileDrop,
                          view: FileDrop.view,
                          toParentMessage: (message) => media(GotFileDropMessage({ message })),
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
                                    onClick: media(
                                      SelectedStoredImage({ mediaObjectId: image.id }),
                                    ),
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

export const canvasShell = (h: HtmlFactory, canvasModel: CanvasModel, mediaModel: MediaModel) => {
  const { elements, selectedElementId, deleteDialog } = canvasModel;
  const { fileDrop } = mediaModel;
  return h.div(
    [
      h.Class(
        "w-full min-w-0 max-w-[1080px] overflow-x-auto overflow-y-hidden border border-line bg-canvas",
      ),
    ],
    [
      h.div(
        [
          h.OnMount({
            name: "canvas-paste",
            f: () => canvasPaste().pipe(Stream.map(canvas)),
          }),
          h.DataAttribute("entry-canvas", "true"),
          h.Style({ width: "1080px", height: "760px" }),
          h.Class("relative touch-pan-x bg-canvas overflow-hidden"),
        ],
        [
          h.div(
            [
              h.DataAttribute("canvas-background", "true"),
              h.OnPointerDown(() => Option.some(canvas(DeselectedCanvasElement()))),
              h.Class("absolute inset-0 z-0"),
            ],
            [],
          ),
          h.div(
            [
              h.Class(
                "pointer-events-none absolute inset-0 z-0 opacity-40 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:28px_28px]",
              ),
            ],
            [],
          ),
          ...[...elements]
            .sort((a, b) => a.layer - b.layer)
            .map((element) =>
              CanvasItem(
                h,
                element,
                selectedElementId,
                canvasModel.toolbarMenu,
                canvasModel.textFormat,
                canvasModel.history.revision,
              ),
            ),
          DeleteDialog(h, deleteDialog),
          UploadDialog(h, mediaModel),
        ],
      ),
    ],
  );
};

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

const canvas = (message: import("../../core/canvas/message").CanvasMessage): AppMessage =>
  GotCanvasMessage({ message });
const media = (message: import("../../core/media/message").MediaMessage): AppMessage =>
  GotMediaMessage({ message });
