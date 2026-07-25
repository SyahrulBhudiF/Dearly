import { Html } from "foldkit";
import { ArrowLeft } from "lucide";
import type { AppMessage } from "../../core/app/message";
import { calendarRouter } from "../../core/route";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const CalendarLink = (h: HtmlFactory) =>
  h.a(
    [
      h.Href(calendarRouter()),
      h.Class(
        "flex items-center gap-1 font-note text-[11px] tracking-[.1em] text-muted hover:text-wine uppercase",
      ),
    ],
    [icon(h, ArrowLeft, "Calendar"), "Calendar"],
  );
