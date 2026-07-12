import { describe, expect, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { getEntryByDate, listMonthEntries, saveEntry } from "../../src/modules/entry";
import { context, document, ownerId, savePayload } from "../fakes";

const owner = { ownerId, email: "owner@dearly.test", displayName: "Owner" } as never;

describe("entry module", () => {
  it("saves and lists entry previews", async () => {
    const ctx = context();

    await Effect.runPromise(saveEntry(ctx, owner, savePayload as never));
    const previews = await Effect.runPromise(listMonthEntries(ctx, owner, "2026-07" as never));

    expect(previews).toEqual([
      { date: "2026-07-12", snippet: "hello", hasSavedEntry: true, hasDraft: false },
    ]);
  });

  it("gets a saved entry by date", async () => {
    const ctx = context();

    await Effect.runPromise(saveEntry(ctx, owner, savePayload as never));
    const entry = await Effect.runPromise(getEntryByDate(ctx, owner, "2026-07-12" as never));

    expect(Option.getOrThrow(entry)).toMatchObject({ ownerId, date: "2026-07-12", document });
  });

  it("returns none for missing entry", async () => {
    const entry = await Effect.runPromise(getEntryByDate(context(), owner, "2026-07-12" as never));

    expect(Option.isNone(entry)).toBe(true);
  });
});
