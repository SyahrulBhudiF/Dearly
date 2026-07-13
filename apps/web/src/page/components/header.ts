import { Button, Dialog } from "@foldkit/ui";
import { Html } from "foldkit";
import { Redo2, Undo2 } from "lucide";
import type { AppMessage } from "../../core/app/message";
import { GotCanvasMessage, GotEntryMessage } from "../../core/app/message";
import { RedidCanvas, UndidCanvas } from "../../core/canvas/message";
import type { Model as CanvasModel } from "../../core/canvas/model";
import {
  DiscardedDraft,
  GotDiscardDialogMessage,
  RequestedDiscard,
  SaveRequested,
} from "../../core/entry/message";
import type { Model as EntryModel } from "../../core/entry/model";
import { dateLabel, weekdayLabel } from "../../libs/date";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const EntryHeader = (h: HtmlFactory, date: string, entry: EntryModel, canvas: CanvasModel) =>
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
        [h.Class("flex items-center gap-2")],
        [
          historyButton(
            h,
            "Undo",
            UndidCanvas(),
            canvas.history.past.length === 0 && canvas.history.activeTextSession === null,
            Undo2,
          ),
          historyButton(
            h,
            "Redo",
            RedidCanvas(),
            canvas.history.future.length === 0 && canvas.history.activeTextSession === null,
            Redo2,
          ),
          Button.view<AppMessage>({
            onClick: GotEntryMessage({ message: RequestedDiscard() }),
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    "ml-1 font-note text-[10px] tracking-[.12em] text-muted hover:text-wine uppercase",
                  ),
                ],
                ["Discard"],
              ),
          }),
          Button.view<AppMessage>({
            onClick: GotEntryMessage({ message: SaveRequested() }),
            isDisabled: entry.saveState === "saving",
            toView: ({ button }) =>
              h.button(
                [
                  ...button,
                  h.Class(
                    "rounded-[var(--radius)] border border-primary bg-primary px-4 py-2 font-note text-[10px] tracking-[.14em] text-primary-foreground shadow-[var(--shadow)] hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:bg-muted uppercase",
                  ),
                ],
                [entry.saveState === "saving" ? "Saving…" : "Save entry"],
              ),
          }),
          DiscardDialog(h, entry.discardDialog),
        ],
      ),
    ],
  );

const historyButton = (
  h: HtmlFactory,
  label: string,
  message: ReturnType<typeof UndidCanvas> | ReturnType<typeof RedidCanvas>,
  disabled: boolean,
  Icon: Parameters<typeof icon>[1],
) =>
  Button.view<AppMessage>({
    onClick: GotCanvasMessage({ message }),
    isDisabled: disabled,
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.AriaLabel(label),
          h.Class(
            "grid size-8 place-items-center rounded-lg text-muted hover:bg-rose/35 hover:text-wine disabled:opacity-30",
          ),
        ],
        [icon(h, Icon, label)],
      ),
  });

const DiscardDialog = (h: HtmlFactory, model: Dialog.Model) =>
  h.submodel({
    slotId: "discard-entry",
    model,
    view: Dialog.view,
    toParentMessage: (message) =>
      GotEntryMessage({ message: GotDiscardDialogMessage({ message }) }),
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
                    h.div([...backdrop, h.Class("fixed inset-0 z-50 bg-ink/30")], []),
                    h.div(
                      [
                        ...panel,
                        h.Class(
                          "fixed top-1/2 left-1/2 z-50 w-[min(90vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-line bg-paper p-6 shadow-[var(--shadow)]",
                        ),
                      ],
                      [
                        h.h2([...title, h.Class("font-display text-2xl")], ["Discard this entry?"]),
                        h.p(
                          [...description, h.Class("mt-2 text-sm text-muted")],
                          ["All unsaved Canvas changes will be removed."],
                        ),
                        h.div(
                          [h.Class("mt-6 flex justify-end gap-3")],
                          [
                            h.button(
                              [...closeButton, h.Class("px-3 py-2 text-sm hover:text-wine")],
                              ["Cancel"],
                            ),
                            Button.view<AppMessage>({
                              onClick: GotEntryMessage({ message: DiscardedDraft() }),
                              toView: ({ button }) =>
                                h.button(
                                  [
                                    ...button,
                                    ...initialFocus,
                                    h.Class(
                                      "rounded-[var(--radius)] bg-wine px-3 py-2 text-sm text-paper",
                                    ),
                                  ],
                                  ["Discard entry"],
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
