import { Button, Textarea } from "@foldkit/ui";
import { Html } from "foldkit";
import { Grip, Trash2 } from "lucide";
import type { CanvasElement } from "@dearly/domain";
import { canvasElement as draggableCanvasElement } from "../../core/canvasDrag";
import type { AppMessage } from "../../core/message";
import { ChangedText, DeleteCanvasElementRequested } from "../../core/message";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const CanvasItem = (
  h: HtmlFactory,
  element: CanvasElement,
  selectedElementId: string | null,
) => {
  const isText = element.payload.kind === "text";
  const alt = isText
    ? "Diary entry"
    : element.payload.kind === "image"
      ? (element.payload.alt ?? "Entry image")
      : "Entry sticker";
  const isSelected = element.id === selectedElementId;
  return h.keyed("div")(
    element.id,
    [
      h.OnMount({
        name: `canvas-${element.id}`,
        f: (node) => draggableCanvasElement(element, node),
      }),
      h.Style({
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
      }),
      h.DataAttribute("canvas-element", "true"),
      h.DataAttribute("canvas-x", String(element.x)),
      h.DataAttribute("canvas-y", String(element.y)),
      h.DataAttribute("canvas-width", String(element.width)),
      h.DataAttribute("canvas-height", String(element.height)),
      h.DataAttribute("canvas-rotation", String(element.rotation)),
      h.Class(
        `relative z-10 touch-none ${isSelected ? "outline-2 -outline-offset-2 outline-wine" : ""}`,
      ),
    ],
    [
      isText
        ? Textarea.view({
            id: `entry-text-${element.id}`,
            value: textValue(element),
            rows: 6,
            placeholder: "What deserves a place on this page?",
            onInput: (value) => ChangedText({ id: element.id, text: value }),
            toView: ({ textarea }) =>
              h.textarea(
                [
                  ...textarea,
                  h.AriaLabel("Diary entry"),
                  h.Class(
                    "size-full resize-none bg-transparent font-display text-2xl leading-tight placeholder:text-muted/70 focus:outline-none sm:text-3xl",
                  ),
                  h.DataAttribute("canvas-editable", "true"),
                ],
                [],
              ),
          })
        : h.div(
            [h.Class("size-full")],
            [
              element.payload.kind === "sticker" && element.payload.emoji !== undefined
                ? h.span(
                    [h.Class("grid size-full place-items-center text-8xl leading-none")],
                    [element.payload.emoji],
                  )
                : h.img([
                    h.Src(`/media/${element.payload.mediaObjectId}`),
                    h.Alt(alt),
                    h.Class("size-full object-contain"),
                  ]),
            ],
          ),
      ...(isSelected ? canvasControls(h, alt) : []),
    ],
  );
};

const textValue = (element: CanvasElement) => {
  if (element.payload.kind !== "text") return "";
  const paragraph = element.payload.document.content?.[0];
  const content = paragraph?.["content"];
  const value = Array.isArray(content) && content[0];
  return typeof value === "object" && value !== null && typeof value["text"] === "string"
    ? value["text"]
    : "";
};

const canvasControls = (h: HtmlFactory, alt: string) => [
  h.div(
    [
      h.DataAttribute("canvas-controls", "true"),
      h.Class("absolute -top-11 left-0 z-20 flex gap-1 border border-line bg-paper p-1"),
    ],
    [
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
        onClick: DeleteCanvasElementRequested(),
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
        "absolute z-30 left-1/2 -top-16 size-4 -translate-x-1/2 rounded-full border-2 border-wine bg-primary cursor-grab",
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
