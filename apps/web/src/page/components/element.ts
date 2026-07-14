import { Button } from "@foldkit/ui";
import { Html } from "foldkit";
import { AlignCenter, AlignLeft, AlignRight, Grip, Trash2 } from "lucide";
import type { CanvasElement, ShapeKind } from "@dearly/domain";
import { Stream } from "effect";
import { canvasElement as draggableCanvasElement } from "../../core/canvas/drag";
import { richTextEditor } from "../../core/canvas/richText";
import type { AppMessage } from "../../core/app/message";
import { GotCanvasMessage } from "../../core/app/message";
import { RequestedDelete, ToggledToolbarMenu } from "../../core/canvas/message";
import type { TextFormat } from "../../core/canvas/model";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const canvasElementZIndex = (layer: number, selected: boolean) =>
  selected ? 10_000 : layer + 1;

export const canvasControlsPlacement = ({
  x,
  y,
  width,
  height,
}: Pick<CanvasElement, "x" | "y" | "width" | "height">): "top" | "right" | "bottom" | "left" => {
  if (x < 8) return "right";
  if (x + width > 1072) return "left";
  if (y < 56) return "bottom";
  if (y + height > 752) return "top";
  return "top";
};

export const CanvasItem = (
  h: HtmlFactory,
  element: CanvasElement,
  selectedElementId: string | null,
  toolbarMenu: "font" | "size" | "color" | null,
  textFormat: TextFormat,
  historyRevision: number,
) => {
  const isText = element.payload.kind === "text";
  const alt = isText
    ? "Diary entry"
    : element.payload.kind === "image"
      ? (element.payload.alt ?? "Entry image")
      : element.payload.kind === "shape"
        ? `${element.payload.shape} shape`
        : "Entry sticker";
  const isSelected = element.id === selectedElementId;
  return h.keyed("div")(
    element.id,
    [
      h.OnMount({
        name: `canvas-${element.id}`,
        f: (node) => draggableCanvasElement(element, node).pipe(Stream.map(canvas)),
      }),
      h.Style({
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
        zIndex: String(canvasElementZIndex(element.layer, isSelected)),
      }),
      h.DataAttribute("canvas-element", "true"),
      h.DataAttribute("canvas-id", element.id),
      h.DataAttribute("canvas-x", String(element.x)),
      h.DataAttribute("canvas-y", String(element.y)),
      h.DataAttribute("canvas-width", String(element.width)),
      h.DataAttribute("canvas-height", String(element.height)),
      h.DataAttribute("canvas-rotation", String(element.rotation)),
      h.Class(
        `relative touch-none ${isSelected ? "outline-2 -outline-offset-2 outline-wine" : ""}`,
      ),
    ],
    [
      isText
        ? richTextElement(h, element.id, element.payload, historyRevision)
        : element.payload.kind === "shape"
          ? shapeElement(h, element.payload.shape, element.payload.color)
          : h.div(
              [h.Class("size-full")],
              [
                element.payload.kind === "sticker" && element.payload.emoji !== undefined
                  ? h.div(
                      [h.Class("grid size-full place-items-center overflow-hidden")],
                      [
                        h.span(
                          [
                            h.Style({
                              fontSize: `${Math.max(20, Math.min(element.width, element.height) * 0.72)}px`,
                            }),
                            h.Class("block leading-none"),
                          ],
                          [element.payload.emoji],
                        ),
                      ],
                    )
                  : h.img([
                      h.Src(`/media/${element.payload.mediaObjectId}`),
                      h.Alt(alt),
                      h.Class("size-full object-contain"),
                    ]),
              ],
            ),
      ...(isSelected
        ? canvasControls(h, alt, isText, toolbarMenu, textFormat, canvasControlsPlacement(element))
        : []),
    ],
  );
};

const shapeElement = (h: HtmlFactory, shape: ShapeKind, color: string) =>
  h.div(
    [
      h.Style({ backgroundColor: color }),
      h.Class(
        `size-full ${
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
                    : "rounded-[8px]"
        }`,
      ),
    ],
    [],
  );

const richTextElement = (
  h: HtmlFactory,
  id: string,
  payload: Extract<CanvasElement["payload"], { readonly kind: "text" }>,
  historyRevision: number,
) => {
  return h.keyed("div")(
    `rich-text-${id}-${historyRevision}`,
    [
      h.OnMount({
        name: `rich-text-${id}-${historyRevision}`,
        f: (node) => richTextEditor(id, payload.document, node).pipe(Stream.map(canvas)),
      }),
      h.Class("size-full bg-transparent font-display text-2xl leading-tight sm:text-3xl"),
    ],
    [
      h.div(
        [
          h.DataAttribute("rich-text-editor", "true"),
          h.AriaLabel("Diary entry"),
          h.Class("size-full overflow-auto [overflow-wrap:anywhere]"),
        ],
        [],
      ),
    ],
  );
};

const richTextMenu = (
  h: HtmlFactory,
  label: string,
  options: ReadonlyArray<{
    readonly label: string;
    readonly attribute: string;
    readonly value: string;
  }>,
  activeValue: string,
  menu: "font" | "size" | "color",
  open: boolean,
  color = false,
) =>
  h.div(
    [h.Class("relative")],
    [
      h.button(
        [
          h.DataAttribute("rich-text-menu", "true"),
          h.OnClick(canvas(ToggledToolbarMenu({ menu }))),
          h.AriaLabel(label),
          h.DataAttribute("rich-text-menu-trigger", label.toLowerCase()),
          h.Class(
            "flex h-8 items-center justify-center gap-1 rounded-[calc(var(--radius)-0.65rem)] px-2 font-note text-xs hover:bg-rose/35",
          ),
        ],
        [
          ...(color
            ? [
                h.span(
                  [h.Class("size-2.5 rounded-[2px]"), h.Style({ backgroundColor: activeValue })],
                  [],
                ),
              ]
            : []),
          h.span([h.DataAttribute("rich-text-menu-label", "true")], [label]),
          h.span([h.Class("text-[10px] text-muted")], ["⌄"]),
        ],
      ),
      h.div(
        [
          h.DataAttribute("rich-text-menu-panel", "true"),
          h.Class(
            `${open ? "" : "hidden "}absolute top-9 left-0 z-40 min-w-28 rounded-[var(--radius)] border border-line bg-paper p-1 shadow-[var(--shadow)]`,
          ),
        ],
        options.map((option) =>
          h.button(
            [
              h.DataAttribute(option.attribute, option.value),
              h.Class(
                `flex w-full items-center justify-between gap-3 rounded-[calc(var(--radius)-0.65rem)] px-2 py-1.5 text-left font-note text-xs hover:bg-rose/35 ${activeValue === option.value ? "bg-rose/35 text-wine" : ""}`,
              ),
              ...(color ? [h.Style({ color: option.value })] : []),
            ],
            [
              ...(color ? [h.span([h.Class("size-3 rounded-[2px] bg-current")], [])] : []),
              h.span([h.Class("grow")], [option.label]),
              ...(activeValue === option.value
                ? [h.span([h.AriaHidden(true), h.Class("font-display text-sm")], ["✓"])]
                : []),
            ],
          ),
        ),
      ),
    ],
  );

const fontLabel = (value: string) =>
  value.includes("Gaegu")
    ? "Gaegu"
    : value.includes("Nanum")
      ? "Nanum pen"
      : value.includes("Gowun")
        ? "Gowun"
        : value === "monospace"
          ? "Mono"
          : "Dearly";

const colorLabel = (value: string) =>
  value === "var(--primary)"
    ? "Rose"
    : value === "var(--secondary-foreground)"
      ? "Sage"
      : value === "var(--accent-foreground)"
        ? "Butter"
        : "Ink";

const richTextToolbar = (
  h: HtmlFactory,
  toolbarMenu: "font" | "size" | "color" | null,
  textFormat: TextFormat,
) => [
  richTextMenu(
    h,
    fontLabel(textFormat.font),
    [
      { label: "Dearly", attribute: "rich-text-font-family", value: "inherit" },
      { label: "Gaegu", attribute: "rich-text-font-family", value: "'Gaegu', cursive" },
      {
        label: "Nanum pen",
        attribute: "rich-text-font-family",
        value: "'Nanum Pen Script', cursive",
      },
      { label: "Gowun", attribute: "rich-text-font-family", value: "'Gowun Dodum', sans-serif" },
      { label: "Mono", attribute: "rich-text-font-family", value: "monospace" },
    ],
    textFormat.font,
    "font",
    toolbarMenu === "font",
  ),
  richTextMenu(
    h,
    textFormat.size.replace("px", ""),
    [
      { label: "10", attribute: "rich-text-font-size", value: "10px" },
      { label: "12", attribute: "rich-text-font-size", value: "12px" },
      { label: "14", attribute: "rich-text-font-size", value: "14px" },
      { label: "16", attribute: "rich-text-font-size", value: "16px" },
      { label: "18", attribute: "rich-text-font-size", value: "18px" },
      { label: "20", attribute: "rich-text-font-size", value: "20px" },
      { label: "24", attribute: "rich-text-font-size", value: "24px" },
      { label: "28", attribute: "rich-text-font-size", value: "28px" },
      { label: "32", attribute: "rich-text-font-size", value: "32px" },
      { label: "36", attribute: "rich-text-font-size", value: "36px" },
      { label: "40", attribute: "rich-text-font-size", value: "40px" },
      { label: "48", attribute: "rich-text-font-size", value: "48px" },
      { label: "56", attribute: "rich-text-font-size", value: "56px" },
      { label: "64", attribute: "rich-text-font-size", value: "64px" },
    ],
    textFormat.size,
    "size",
    toolbarMenu === "size",
  ),
  richTextMenu(
    h,
    colorLabel(textFormat.color),
    [
      { label: "Ink", attribute: "rich-text-color", value: "var(--foreground)" },
      { label: "Rose", attribute: "rich-text-color", value: "var(--primary)" },
      { label: "Sage", attribute: "rich-text-color", value: "var(--secondary-foreground)" },
      { label: "Butter", attribute: "rich-text-color", value: "var(--accent-foreground)" },
    ],
    textFormat.color,
    "color",
    toolbarMenu === "color",
    true,
  ),
  ...(["left", "center", "right"] as const).map((align) =>
    h.button(
      [
        h.DataAttribute("rich-text-align", align),
        h.AriaLabel(`Align ${align}`),
        h.AriaPressed(String(textFormat.align === align)),
        h.Class(
          `grid size-8 place-items-center rounded-[calc(var(--radius)-0.65rem)] font-note text-xs hover:bg-rose/35 ${textFormat.align === align ? "bg-wine text-paper" : ""}`,
        ),
      ],
      [
        icon(
          h,
          align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight,
          `Align ${align}`,
        ),
      ],
    ),
  ),
  ...(["bold", "italic", "underline"] as const).map((action) =>
    h.button(
      [
        h.DataAttribute("rich-text-action", action),
        h.AriaLabel(action),
        h.AriaPressed(String(textFormat[action])),
        h.Class(
          `grid size-8 place-items-center rounded-[calc(var(--radius)-0.65rem)] font-display text-sm hover:bg-rose/35 ${textFormat[action] ? "bg-wine text-paper" : ""}`,
        ),
      ],
      [action === "bold" ? "B" : action === "italic" ? "I" : "U"],
    ),
  ),
];

const controlsPlacementClass = {
  top: "bottom-[calc(100%+0.75rem)] left-0",
  right: "left-[calc(100%+0.75rem)] top-0",
  bottom: "top-[calc(100%+0.75rem)] left-0",
  left: "right-[calc(100%+0.75rem)] top-0",
} as const;

const rotatePlacementClass = {
  top: "left-1/2 -top-[4.75rem] -translate-x-1/2",
  right: "top-1/2 -right-[6.75rem] -translate-y-1/2",
  bottom: "left-1/2 -bottom-[4.75rem] -translate-x-1/2",
  left: "top-1/2 -left-[6.75rem] -translate-y-1/2",
} as const;

const canvasControls = (
  h: HtmlFactory,
  alt: string,
  isText: boolean,
  toolbarMenu: "font" | "size" | "color" | null,
  textFormat: TextFormat,
  placement: "top" | "right" | "bottom" | "left",
) => [
  h.div(
    [
      h.DataAttribute("canvas-controls", "true"),
      h.Class(
        `absolute z-40 flex gap-1 rounded-xl border border-line bg-paper p-1 shadow-[var(--shadow)] ${controlsPlacementClass[placement]}`,
      ),
    ],
    [
      ...(isText ? richTextToolbar(h, toolbarMenu, textFormat) : []),
      h.span(
        [
          h.DataAttribute("canvas-grab", "true"),
          h.AriaLabel("Drag element"),
          h.Class(
            "grid size-8 cursor-grab place-items-center active:cursor-grabbing hover:bg-rose/35",
          ),
        ],
        [icon(h, Grip, "Drag element")],
      ),
      Button.view<AppMessage>({
        onClick: canvas(RequestedDelete()),
        toView: ({ button }) =>
          h.button(
            [
              ...button,
              h.AriaLabel(`Delete ${alt}`),
              h.Class("grid size-8 place-items-center hover:bg-rose/35"),
            ],
            [icon(h, Trash2, `Delete ${alt}`)],
          ),
      }),
    ],
  ),
  h.span(
    [
      h.DataAttribute("canvas-rotate", "true"),
      h.AriaLabel(`Rotate ${alt}`),
      h.Class(
        `absolute z-50 size-4 rounded-full border-2 border-wine bg-primary cursor-grab ${rotatePlacementClass[placement]}`,
      ),
    ],
    [],
  ),
  ...(
    [
      ["north-west", "-left-1 -top-1 cursor-nwse-resize"],
      ["north", "left-1/2 -top-1 -translate-x-1/2 cursor-ns-resize"],
      ["north-east", "-right-1 -top-1 cursor-nesw-resize"],
      ["east", "-right-1 top-1/2 -translate-y-1/2 cursor-ew-resize"],
      ["south-east", "-right-1 -bottom-1 cursor-nwse-resize"],
      ["south", "left-1/2 -bottom-1 -translate-x-1/2 cursor-ns-resize"],
      ["south-west", "-left-1 -bottom-1 cursor-nesw-resize"],
      ["west", "-left-1 top-1/2 -translate-y-1/2 cursor-ew-resize"],
    ] as const
  ).map(([handle, position]) =>
    h.span(
      [
        h.DataAttribute("canvas-resize", handle),
        h.AriaLabel(`Resize ${alt}`),
        h.Class(`absolute z-20 size-2 rounded-full border border-wine bg-paper ${position}`),
      ],
      [],
    ),
  ),
];

const canvas = (message: import("../../core/canvas/message").CanvasMessage): AppMessage =>
  GotCanvasMessage({ message });
