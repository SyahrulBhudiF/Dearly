import { Option } from "effect";
import { Html } from "foldkit";
import { createLazy } from "foldkit/html";
import type { Model } from "../core/app/model";
import type { AppMessage } from "../core/app/message";
import { GotCanvasMessage, GotEntryMessage } from "../core/app/message";
import { SaveRequested } from "../core/entry/message";
import { RedidCanvas, UndidCanvas } from "../core/canvas/message";
import { CalendarLink } from "./components/link";
import { EntryHeader } from "./components/header";
import { Notifications } from "./components/notifications";
import { canvasShell, toolRail } from "./components/entry";

const h = Html.html<AppMessage>();
const lazyToolRail = createLazy();
const lazyCanvasShell = createLazy();
const lazyEntryHeader = createLazy();
const lazyNotifications = createLazy();

export const entryPage = (model: Model): Html.Document => ({
  title: `Dearly — ${model.calendar.selectedDate}`,
  body: h.main(
    [
      h.OnKeyDownPreventDefault((key, modifiers) => {
        if (!modifiers.metaKey && !modifiers.ctrlKey) return Option.none();
        const normalized = key.toLowerCase();
        if (normalized === "s")
          return Option.some(GotEntryMessage({ message: SaveRequested() }));
        if (normalized === "z") {
          const target = document.activeElement;
          if (
            target?.closest?.(".ProseMirror") ||
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement
          )
            return Option.none();
          return Option.some(
            GotCanvasMessage({
              message: modifiers.shiftKey ? RedidCanvas() : UndidCanvas(),
            }),
          );
        }
        return Option.none();
      }),
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
        [CalendarLink(h), h.span([], [])],
      ),
      h.section(
        [
          h.Class(
            "mx-auto grid max-w-6xl gap-8 py-10 lg:grid-cols-[72px_minmax(0,1fr)]",
          ),
        ],
        [
          lazyToolRail(toolRail, [h, model.media, model.canvas]),
          h.div(
            [h.Class("min-w-0")],
            [
              lazyEntryHeader(EntryHeader, [
                h,
                model.calendar.selectedDate,
                model.entry,
                model.canvas,
              ]),
              h.div(
                [h.Class("flex justify-center")],
                [lazyCanvasShell(canvasShell, [h, model.canvas, model.media])],
              ),
            ],
          ),
        ],
      ),
      lazyNotifications(Notifications, [h, model.notifications]),
    ],
  ),
});
