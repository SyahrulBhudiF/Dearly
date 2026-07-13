import { Html } from "foldkit";
import { CircleCheck, CircleX, X } from "lucide";
import type { AppMessage } from "../../core/app/message";
import { DismissedNotification } from "../../core/app/message";
import type { Model } from "../../core/notification/model";
import { icon } from "./icon";

type HtmlFactory = ReturnType<typeof Html.html<AppMessage>>;

export const Notifications = (h: HtmlFactory, notifications: ReadonlyArray<Model>) =>
  h.div(
    [
      h.AriaLive("polite"),
      h.Class("fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"),
    ],
    notifications.map((notification) =>
      h.keyed("div")(
        notification.id,
        [
          h.Role("status"),
          h.Class(
            "flex items-center gap-3 rounded-[var(--radius)] border border-line bg-paper px-4 py-3 text-ink shadow-[var(--shadow)]",
          ),
        ],
        [
          icon(h, notification.kind === "error" ? CircleX : CircleCheck, notification.kind),
          h.p([h.Class("min-w-0 grow font-note text-sm")], [notification.message]),
          h.button(
            [
              h.OnClick(DismissedNotification({ id: notification.id })),
              h.AriaLabel("Dismiss notification"),
              h.Class("grid size-7 place-items-center rounded-md text-muted hover:bg-rose/30"),
            ],
            [icon(h, X, "Dismiss")],
          ),
        ],
      ),
    ),
  );
