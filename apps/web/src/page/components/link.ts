import { Button } from "@foldkit/ui";
import { Html } from "foldkit";
import { ArrowLeft } from "lucide";
import type { AppMessage } from "../../core/message";
import { ChangedRoute } from "../../core/message";
import { CalendarRoute } from "../../core/route";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const CalendarLink = (h: HtmlFactory) =>
  Button.view<AppMessage>({
    onClick: ChangedRoute({ route: CalendarRoute() }),
    toView: ({ button }) =>
      h.button(
        [
          ...button,
          h.Class(
            "flex items-center gap-1 font-note text-[11px] tracking-[.1em] text-muted hover:text-wine uppercase",
          ),
        ],
        [icon(h, ArrowLeft, "Calendar"), "Calendar"],
      ),
  });
