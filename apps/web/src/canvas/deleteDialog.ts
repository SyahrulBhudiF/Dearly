import { Button, Dialog } from "@foldkit/ui";
import { Html } from "foldkit";
import type { AppMessage } from "../app/message";
import { GotCanvasMessage } from "../app/message";
import { CutCanvasElement, DeletedCanvasElement, GotDeleteDialogMessage } from "./message";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const DeleteDialog = (
  h: HtmlFactory,
  deleteDialog: Dialog.Model,
  pendingRemoval: "cut" | "delete" | null,
): ReturnType<HtmlFactory["submodel"]> =>
  h.submodel({
    slotId: "delete-canvas-element",
    model: deleteDialog,
    view: Dialog.view,
    toParentMessage: (message) =>
      GotCanvasMessage({ message: GotDeleteDialogMessage({ message }) }),
    viewInputs: {
      toView: ({
        dialog,
        backdrop,
        panel,
        title,
        description,
        closeButton,
        initialFocus,
        isVisible,
      }) =>
        h.dialog(
          [...dialog],
          [
            isVisible
              ? h.div(
                  [],
                  [
                    h.div([...backdrop, h.Class("fixed inset-0 bg-ink/30")], []),
                    h.div(
                      [
                        ...panel,
                        h.DataAttribute("canvas-dialog", "true"),
                        h.Class(
                          "fixed top-1/2 left-1/2 w-[min(90vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-line bg-paper p-6 shadow-[var(--shadow)]",
                        ),
                      ],
                      [
                        h.h2(
                          [...title, h.Class("font-display text-2xl")],
                          [pendingRemoval === "cut" ? "Cut element?" : "Delete element?"],
                        ),
                        h.p(
                          [...description, h.Class("mt-2 text-sm text-muted")],
                          [
                            pendingRemoval === "cut"
                              ? "The element will be copied before it is removed."
                              : "You can undo this action.",
                          ],
                        ),
                        h.div(
                          [h.Class("mt-6 flex justify-end gap-3")],
                          [
                            h.button(
                              [...closeButton, h.Class("px-3 py-2 text-sm hover:text-wine")],
                              ["Cancel"],
                            ),
                            Button.view<AppMessage>({
                              onClick: GotCanvasMessage({
                                message:
                                  pendingRemoval === "cut"
                                    ? CutCanvasElement()
                                    : DeletedCanvasElement(),
                              }),
                              toView: ({ button }) =>
                                h.button(
                                  [
                                    ...button,
                                    ...initialFocus,
                                    h.Class(
                                      "rounded-[var(--radius)] bg-wine px-3 py-2 text-sm text-paper",
                                    ),
                                  ],
                                  [pendingRemoval === "cut" ? "Cut" : "Delete"],
                                ),
                            }),
                          ],
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
