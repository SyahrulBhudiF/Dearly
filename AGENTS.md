# Dearly

Private single-owner diary app. Monorepo: Bun + Turbo, Effect-TS, Cloudflare Workers + D1 + R2.

## Commands

| Task         | Command                                               | Notes                        |
| ------------ | ----------------------------------------------------- | ---------------------------- |
| Build all    | `bun run build`                                       | Compiles domain → rpc → apps |
| Type check   | `bun run check`                                       | `tsc --noEmit` per package   |
| Lint         | `bun run lint`                                        | oxlint                       |
| Format       | `bun run fmt`                                         | oxfmt                        |
| Format check | `bun run fmt:check`                                   | CI gate                      |
| Test all     | `bun run test`                                        | vitest, builds deps first    |
| Dev worker   | `cd apps/worker && bun run dev`                       | `bun --watch`                |
| Single test  | `cd packages/domain && bun vitest run -t "test name"` | Per-package vitest           |

## Architecture

```
apps/worker   → Cloudflare Worker (RPC, auth, media, static assets)
packages/domain → Effect Schema types, branded IDs, tagged errors
packages/rpc   → shared RpcGroup definition
```

Flow: Browser → same-origin Effect RPC → Worker → D1/R2/OAuth.

## Code Conventions

### TypeScript

- Strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- ESM only (`"type": "module"`), target ES2022
- `import type` for type-only imports (enforced by verbatimModuleSyntax)
- Prefer `ReadonlyArray<T>` over `T[]` in interfaces

### Effect-TS Patterns

- **Errors**: `Schema.TaggedErrorClass` with `_tag` discriminant. Define in `packages/domain/src/errors.ts`.
- **IDs**: Branded UUIDs via `Schema.brand()`. Define in `packages/domain/src/ids.ts`.
- **Schemas**: `Schema.Struct`, `Schema.Union`, `Schema.Literals`. Export both schema and inferred type.
- **Worker effects**: `Effect.Effect<A, AppError>` aliased as `WorkerEffect<A>` in `apps/worker/src/libs/http.ts`.
- **Options**: `Option.Option<T>` for nullable returns. Use `Option.match` not null checks.
- **Config**: `Config.*` + `ConfigProvider.fromEnv` in `apps/worker/src/config/env.ts`.
- **DB queries**: Wrap in `Effect.promise()`, map results through `Schema.decodeUnknownOption`.
- RPC procedures: defined in `packages/rpc/src/index.ts` via `Rpc.make()`.

### Naming

- Files: `camelCase.ts` for modules, `PascalCase` for exported classes/schemas
- Schema export + type export pair: `export const Foo = Schema.Struct({...}); export type Foo = Schema.Schema.Type<typeof Foo>;`
- Error classes: `PascalCase` matching their `_tag` (e.g., `class NotFound`, tag `"NotFound"`)

### Error Handling

- Fail with typed tagged errors, never raw `Error`
- `appErrorToResponse` in `libs/http.ts` maps errors → HTTP status
- `Effect.die` for programmer errors (missing bindings)
- `Effect.orDie` for config load failures

### Testing

- `@effect/vitest`: `describe`, `it`, `expect` from `"@effect/vitest"`
- Schema validation tests: `Schema.decodeUnknownResult(Schema)(value)._tag === "Success"|"Failure"`
- Worker tests: call `handleRequest(request, env)` directly, assert status + JSON body
- Fakes defined in `tests/fakes.ts`

### Database (D1 + Drizzle)

- Schema in `apps/worker/src/database/schema.ts` using `drizzle-orm/sqlite-core`
- Client via `drizzle(binding, { schema })` in `apps/worker/src/database/client.ts`
- All columns `text()` for IDs/dates (UUIDs and ISO strings)
- JSON payloads stored as `text("col", { mode: "json" })`

### Linting & Formatting

- oxlint + oxfmt, run via lint-staged on `*.ts` pre-commit
- husky for git hooks

## Project Language

Use domain terms from `docs/context.md`:

- **Owner** (not account/member), **Diary Entry** (not post/page), **Canvas** (not document), **Canvas Element** (not block/widget), **Draft** (not autosave), **Date Card** (not calendar tile), **Sticker** (not emoji), **Staged Media** (not temp upload)
