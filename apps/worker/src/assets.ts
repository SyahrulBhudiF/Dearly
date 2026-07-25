import { Effect } from "effect";
import { AssetService } from "./services/assets";

export const assets = Effect.fn("assets")(function* (request: Request) {
    const svc = yield* AssetService;
    return yield* svc.fetch(request);
  });
