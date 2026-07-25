import type {
  CalendarDate,
  CalendarMonth,
  DiaryEntry,
  EntryPreview,
  SaveEntryPayload,
  Unauthorized,
} from "@dearly/domain";
import { Context, Effect, Layer, Option } from "effect";
import { requireOwner } from "../session";
import { DatabaseService } from "./database";
import type { ConfigService } from "./config";
import type { RequestService } from "./appLayer";

interface EntryServiceShape {
  readonly listMonthEntries: (
    month: CalendarMonth,
  ) => Effect.Effect<ReadonlyArray<EntryPreview>, Unauthorized, ConfigService | RequestService>;
  readonly getEntryByDate: (
    date: CalendarDate,
  ) => Effect.Effect<Option.Option<DiaryEntry>, Unauthorized, ConfigService | RequestService>;
  readonly saveEntry: (
    payload: SaveEntryPayload,
  ) => Effect.Effect<DiaryEntry, Unauthorized, ConfigService | RequestService>;
  readonly discardServerEntry: (
    date: CalendarDate,
  ) => Effect.Effect<void, Unauthorized, ConfigService | RequestService>;
}

export class EntryService extends Context.Service<EntryService, EntryServiceShape>()(
  "EntryService",
) {}

export const EntryLive = Layer.effect(
  EntryService,
  Effect.gen(function* () {
    const db = yield* DatabaseService;

    return EntryService.of({
      listMonthEntries: Effect.fn("EntryService.listMonthEntries")(function* (
        month: CalendarMonth,
      ) {
        const owner = yield* requireOwner;
        return yield* db.listMonthEntries(owner, month);
      }),
      getEntryByDate: Effect.fn("EntryService.getEntryByDate")(function* (date: CalendarDate) {
        const owner = yield* requireOwner;
        return yield* db.findEntryByDate(owner, date);
      }),
      saveEntry: Effect.fn("EntryService.saveEntry")(function* (payload: SaveEntryPayload) {
        const owner = yield* requireOwner;
        return yield* db.saveEntry(owner, payload);
      }),
      discardServerEntry: Effect.fn("EntryService.discardServerEntry")(function* (
        date: CalendarDate,
      ) {
        const owner = yield* requireOwner;
        return yield* db.deleteEntryByDate(owner, date);
      }),
    });
  }),
);
