import { Option } from "effect";
import { Html } from "foldkit";
import type { AppMessage } from "../core/message";
import { SaveRequested } from "../core/message";
import type { Model } from "../core/model";
import { CalendarLink } from "./components/link";
import { EntryHeader } from "./components/header";
import { canvasShell, toolRail } from "./components/entry";

export const entryPage = (model: Model): Html.Document => {
  const h = Html.html<AppMessage>();
  const status =
    model.saveState === "saving"
      ? "Saving draft"
      : model.saveState === "failed"
        ? "Could not save"
        : model.entryText === model.savedText
          ? "Saved"
          : "Local draft · unsaved";

  return {
    title: `Dearly — ${model.selectedDate}`,
    body: h.main(
      [
        h.OnKeyDownPreventDefault((key, modifiers) =>
          (modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "s"
            ? Option.some(SaveRequested())
            : Option.none(),
        ),
        h.Class(
          "paper-grain min-h-screen bg-paper px-5 py-7 text-ink sm:px-10 lg:px-16",
        ),
      ],
      [
        h.header(
          [
            h.Class(
              "mx-auto flex max-w-6xl items-center justify-between border-b border-line pb-5",
            ),
          ],
          [
            CalendarLink(h),
            h.p(
              [
                h.Class(
                  "font-note text-[10px] tracking-[.13em] text-wine uppercase",
                ),
              ],
              [status],
            ),
          ],
        ),
        h.section(
          [
            h.Class(
              "mx-auto grid max-w-6xl gap-8 py-10 lg:grid-cols-[72px_minmax(0,1fr)]",
            ),
          ],
          [
            toolRail(
              h,
              model.imagePopover,
              model.images,
              model.imageSearch,
              model.stickerPopover,
              model.stickers,
              model.stickerSearch,
              model.stickerTab,
              model.emojiSearch,
              model.emojiList,
              model.stickerFileDrop,
              model.fileDrop,
            ),
            h.div(
              [h.Class("min-w-0")],
              [
                EntryHeader(h, model.selectedDate, model.saveState),
                h.div([ h.Class("flex justify-center")],
                [
                  canvasShell(
                    h,
                    model.fileDrop,
                    model.elements,
                    model.selectedElementId,
                    model.deleteDialog,
                    model.uploadState,
                  ),
                ]),
              ],
            ),
          ],
        ),
      ],
    ),
  };
};
