import { Button, Dialog } from "@foldkit/ui";
import { Html } from "foldkit";
import type { AppMessage } from "../../core/message";
import { ChangedUploadTitle, ConfirmedUpload, GotUploadDialogMessage } from "../../core/message";
import type { Model } from "../../core/model";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const UploadDialog = (h: HtmlFactory, model: Model): ReturnType<HtmlFactory["submodel"]> =>
  h.submodel({
    slotId: "upload-title",
    model: model.uploadDialog,
    view: Dialog.view,
    toParentMessage: (message) => GotUploadDialogMessage({ message }),
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
            isVisible && model.pendingUpload !== null
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
                          [
                            model.pendingUpload.kind === "image"
                              ? "Name this image"
                              : "Name this sticker",
                          ],
                        ),
                        h.p(
                          [...description, h.Class("mt-2 text-sm text-muted")],
                          ["This name helps you find it later."],
                        ),
                        h.input([
                          ...initialFocus,
                          h.Type("text"),
                          h.Value(model.pendingUpload.title),
                          h.AriaLabel("Title"),
                          h.OnInput((value) => ChangedUploadTitle({ title: value })),
                          h.Class(
                            "mt-5 w-full rounded-[var(--radius)] border border-line bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none",
                          ),
                        ]),
                        h.div(
                          [h.Class("mt-6 flex justify-end gap-3")],
                          [
                            h.button(
                              [...closeButton, h.Class("px-3 py-2 text-sm hover:text-wine")],
                              ["Cancel"],
                            ),
                            Button.view<AppMessage>({
                              onClick: ConfirmedUpload(),
                              toView: ({ button }) =>
                                h.button(
                                  [
                                    ...button,
                                    h.Class(
                                      "rounded-[var(--radius)] bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-85",
                                    ),
                                  ],
                                  ["Upload"],
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
