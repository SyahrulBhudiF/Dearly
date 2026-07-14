import { Match } from "effect";
import { Runtime, Subscription, type Url } from "foldkit";
import { overlay } from "@foldkit/devtools";
import { VirtualList } from "@foldkit/ui";
import type { UrlRequest } from "foldkit/navigation";
import { AppMessage, ChangedRoute, GotMediaMessage } from "./core/app/message";
import { initialModel, Model } from "./core/app/model";
import { init } from "./core/app/init";
import { update } from "./core/app/update";
import { GotEmojiListMessage } from "./core/media/message";
import { parseRoute } from "./core/route";
import { view } from "./view";

export const application = Runtime.makeApplication({
  Model,
  init: (url: Url.Url) => init(initialModel(parseRoute(url))),
  update,
  view,
  subscriptions: Subscription.lift({
    emojiListEvents: VirtualList.subscriptions.containerEvents,
  })<Model, AppMessage>({
    toChildModel: (model) => model.media.emojiList,
    toParentMessage: (message) => GotMediaMessage({ message: GotEmojiListMessage({ message }) }),
  }),
  container: document.getElementById("root"),
  routing: {
    onUrlRequest: (request: UrlRequest) =>
      Match.value(request).pipe(
        Match.tagsExhaustive({
          Internal: ({ url }) => ChangedRoute({ route: parseRoute(url) }),
          External: () => ChangedRoute({ route: parseRoute({ pathname: "/" } as never) }),
        }),
      ),
    onUrlChange: (url: Url.Url) => ChangedRoute({ route: parseRoute(url) }),
  },
  devTools: { Message: AppMessage, overlay },
});
