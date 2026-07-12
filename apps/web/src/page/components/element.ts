import { Button, Textarea } from "@foldkit/ui";
import { Option } from "effect";
import { Html } from "foldkit";
import { ArrowDownLeft, ArrowUpRight, RotateCw, Trash2 } from "lucide";
import type { CanvasElement } from "@dearly/domain";
import { canvasElement as draggableCanvasElement } from "../../core/canvasDrag";
import type { AppMessage } from "../../core/message";
import {
  ChangedCanvasElementLayer,
  DeleteCanvasElementRequested,
  StartedResize,
  RotatedCanvasElement,
  SelectedCanvasElement,
  ChangedText,
} from "../../core/message";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const CanvasItem = (
  h: HtmlFactory,
  element: CanvasElement,
  selectedElementId: string | null,
  text: string,
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
        f: (node) => draggableCanvasElement(element.id, element, node),
      }),
      h.Style({
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
      }),
      h.OnClick(SelectedCanvasElement({ id: element.id })),
      h.Class(
        `cursor-move touch-none ${isSelected ? "ring-2 ring-wine ring-offset-2 ring-offset-canvas" : ""}`,
      ),
    ],
    [
      isText
        ? Textarea.view({
            id: `entry-text-${element.id}`,
            value: text,
            rows: 6,
            placeholder: "What deserves a place on this page?",
            onInput: (value) => ChangedText({ text: value }),
            toView: ({ textarea }) =>
              h.textarea(
                [
                  ...textarea,
                  h.AriaLabel("Diary entry"),
                  h.Class(
                    "size-full resize-none bg-transparent font-display text-2xl leading-tight placeholder:text-muted/70 focus:outline-none sm:text-3xl",
                  ),
                ],
                [],
              ),
          })
        : h.img([
            h.Src(`/media/${element.payload.mediaObjectId}`),
            h.Alt(alt),
            h.Class("size-full object-contain"),
          ]),
      isSelected ? canvasControls(h) : null,
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

const canvasControls = (h: HtmlFactory) =>
  h.div(
    [h.Class("absolute -top-11 left-0 flex gap-1 border border-line bg-paper p-1")],
    [
      controlButton(h, "Rotate", RotateCw, RotatedCanvasElement({ degrees: 15 })),
      controlButton(
        h,
        "Bring forward",
        ArrowUpRight,
        ChangedCanvasElementLayer({ direction: "forward" }),
      ),
      controlButton(
        h,
        "Send backward",
        ArrowDownLeft,
        ChangedCanvasElementLayer({ direction: "backward" }),
      ),
      controlButton(h, "Delete", Trash2, DeleteCanvasElementRequested()),
    ],
  );

const controlButton = (
  h: HtmlFactory,
  label: string,
  symbol: Parameters<typeof icon>[1],
  onClick: AppMessage,
) =>
  Button.view<AppMessage>({
    onClick,
    toView: ({ button }) =>
      h.button(
        [...button, h.AriaLabel(label), h.Class("grid size-8 place-items-center hover:bg-rose/35")],
        [icon(h, symbol, label)],
      ),
  });
