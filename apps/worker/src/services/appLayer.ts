import type { WorkerEnv } from "../../alchemy.run";
import { Context, Layer } from "effect";
import { AssetLive } from "./assets";
import { ConfigLive } from "./config";
import { DatabaseLive } from "./database";
import { EntryLive } from "./entry";
import { MediaLive } from "./media";
import { MediaStorageLive } from "./mediaStorage";
import { StickerLive } from "./sticker";

// Per-request service: the incoming HTTP request.
// Provided via Effect.provideService before each request is handled.
export class RequestService extends Context.Service<RequestService, Request>()("RequestService") {}

export const makeAppLayer = (env: WorkerEnv) => {
  const { MEDIA, ASSETS } = env;
  const ConfigServiceLive = ConfigLive(env);
  const DatabaseServiceLive = DatabaseLive(env.DB);
  const MediaStorageServiceLive = MediaStorageLive(MEDIA);
  const AssetServiceLive = AssetLive(ASSETS);
  const EntryServiceLive = Layer.provideMerge(EntryLive, DatabaseServiceLive);
  const MediaServiceLive = Layer.provideMerge(
    MediaLive,
    Layer.merge(DatabaseServiceLive, MediaStorageServiceLive),
  );
  const StickerServiceLive = Layer.provideMerge(StickerLive, DatabaseServiceLive);

  return Layer.mergeAll(
    ConfigServiceLive,
    DatabaseServiceLive,
    MediaStorageServiceLive,
    AssetServiceLive,
    EntryServiceLive,
    MediaServiceLive,
    StickerServiceLive,
  );
};
