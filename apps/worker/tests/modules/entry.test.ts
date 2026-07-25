import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { EntryService } from "../../src/services/entry";
import { document, ownerId, savePayload, setTestTime, testLayer } from "../fakes";

describe("entry module", () => {
  it.effect("saves and lists entry previews", () =>
    Effect.gen(function*() {
      yield* setTestTime;
      const entry = yield* EntryService;
      yield* entry.saveEntry(savePayload as never);
      const previews = yield* entry.listMonthEntries("2026-07" as never);

      expect(previews).toEqual([
        { date: "2026-07-12", snippet: "hello", hasSavedEntry: true, hasDraft: false },
      ]);
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("gets a saved entry by date", () =>
    Effect.gen(function*() {
      yield* setTestTime;
      const entry = yield* EntryService;
      yield* entry.saveEntry(savePayload as never);
      const result = yield* entry.getEntryByDate("2026-07-12" as never);

      expect(Option.getOrThrow(result)).toMatchObject({ ownerId, date: "2026-07-12", document });
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("discards server entry", () =>
    Effect.gen(function*() {
      yield* setTestTime;
      const entry = yield* EntryService;
      yield* entry.saveEntry(savePayload as never);
      yield* entry.discardServerEntry("2026-07-12" as never);
      const result = yield* entry.getEntryByDate("2026-07-12" as never);

      expect(Option.isNone(result)).toBe(true);
    }).pipe(Effect.provide(testLayer())),
  );

  it.effect("returns none for missing entry", () =>
    Effect.gen(function*() {
      const entry = yield* EntryService;
      const result = yield* entry.getEntryByDate("2026-07-12" as never);

      expect(Option.isNone(result)).toBe(true);
    }).pipe(Effect.provide(testLayer())),
  );
});
