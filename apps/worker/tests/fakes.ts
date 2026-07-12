import { Option } from "effect";
import type { D1Binding, R2Binding } from "../src/types";

export const ownerId = "00000000-0000-4000-8000-000000000001";
export const mediaId = "00000000-0000-4000-8000-000000000003";
export const now = "2026-07-12T00:00:00.000Z";
export const document = { version: 1, logicalWidth: 1000, logicalHeight: 1000, elements: [] };
export const mediaRow = [mediaId, ownerId, "image", "media/image.png", "image/png", 4, now];

export interface DbState {
  hasSession?: boolean;
  media?: unknown[] | null;
  entry?: unknown[];
}

export const fakeDb = (state: DbState = { hasSession: true, media: mediaRow }) =>
  ({
    prepare: (sql: string) => ({
      bind: (...params: ReadonlyArray<unknown>) => ({
        raw: async () => {
          if (sql.includes('from "sessions"')) {
            return state.hasSession !== false && params[0] === "session-1"
              ? [[ownerId, "owner@dearly.test", "Owner"]]
              : [];
          }

          if (sql.includes('insert into "media_objects"')) {
            const row = [params[0], params[1], params[2], params[3], params[4], params[5], now];
            state.media = row;
            return [row];
          }

          if (sql.includes('from "media_objects"')) {
            return state.media === null ? [] : [state.media ?? mediaRow];
          }

          if (sql.includes('insert into "diary_entries"')) {
            state.entry = [params[0], params[1], params[2], params[3], params[4], params[5], now];
            return [state.entry];
          }

          if (sql.includes('from "diary_entries"')) {
            return state.entry === undefined ? [] : [state.entry];
          }

          return [];
        },
        all: async () => ({ results: [] }),
        run: async () => ({}),
      }),
    }),
  }) as D1Binding;

export const fakeR2 = (value = "png") =>
  ({
    get: async () => ({
      body: new Response(value).body,
      arrayBuffer: async () => new TextEncoder().encode(value).buffer,
    }),
    put: async () => ({}),
  }) satisfies R2Binding;

export const request = (path: string, init?: RequestInit) =>
  new Request(`https://dearly.test${path}`, init);

export const authed = { headers: { cookie: "dearly_session=session-1" } };
export const jsonPost = (body: unknown) => ({
  ...authed,
  method: "POST",
  body: JSON.stringify(body),
});

export const context = (state?: DbState) => ({
  config: {
    appEnv: "test",
    timeZone: "Asia/Jakarta",
    googleClientId: Option.none(),
    googleClientSecret: Option.none(),
    githubClientId: Option.none(),
    githubClientSecret: Option.none(),
    sessionSecret: Option.none(),
  } as never,
  env: { DB: fakeDb(state), MEDIA: fakeR2() },
  sessionId: Option.some("session-1"),
});

export const savePayload = {
  date: "2026-07-12",
  document,
  preview: { date: "2026-07-12", snippet: "hello", hasSavedEntry: true, hasDraft: false },
};
