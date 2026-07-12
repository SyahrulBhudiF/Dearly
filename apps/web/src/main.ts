import { Runtime, Subscription, type Url } from "foldkit";
import { VirtualList } from "@foldkit/ui";
import type { UrlRequest } from "foldkit/navigation";
import { AppMessage, ChangedRoute, GotEmojiListMessage } from "./core/message";
import { initialModel, Model } from "./core/model";
import { parseRoute } from "./core/route";
import { init, update } from "./core/update";
import { view } from "./view";

export const application = Runtime.makeApplication({
  Model: Model,
  init: (url: Url.Url) => init(initialModel(parseRoute(url))),
  update,
  view,
  subscriptions: Subscription.lift({
    emojiListEvents: VirtualList.subscriptions.containerEvents,
  })<Model, AppMessage>({
    toChildModel: (model) => model.emojiList,
    toParentMessage: (message) => GotEmojiListMessage({ message }),
  }),
  container: document.getElementById("root"),
  routing: {
    onUrlRequest: (request: UrlRequest) =>
      request._tag === "Internal"
        ? ChangedRoute({ route: parseRoute(request.url) })
        : ChangedRoute({ route: parseRoute({ pathname: "/" } as never) }),
    onUrlChange: (url: Url.Url) => ChangedRoute({ route: parseRoute(url) }),
  },
  devTools: { Message: AppMessage },
});
