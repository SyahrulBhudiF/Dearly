# Foldkit Core Refactor Plan

## Goal

Split the flat `apps/web/src/core` application state machine into feature modules that follow Foldkit's Model → Message → Update → View pattern. Keep current behavior and public routes unchanged.

## Current problems

- `model.ts` combines calendar, entry, Canvas, media upload, picker, dialog, and emoji state.
- `message.ts` exports every app event in one union.
- `update.ts` owns every transition and is too large to test or change locally.
- Rich-text menu state is mutated directly in the DOM (`classList`, `textContent`) rather than represented in the Model.
- Canvas pointer events are a valid Mount boundary, but must remain a narrow adapter that only emits messages.

## Target ownership

```txt
apps/web/src/core/
  app/
    model.ts          # Root route + feature models
    message.ts        # Root envelopes only
    update.ts         # Route/init/delegation only
    init.ts           # App startup commands
  calendar/
    model.ts
    message.ts
    update.ts
  entry/
    model.ts          # Entry loading, saving, drafts, dialogs
    message.ts
    update.ts
  canvas/
    model.ts          # Elements, selection, text toolbar state
    message.ts
    update.ts
    drag.ts           # Existing pointer Mount adapter
    paste.ts          # Existing paste Mount adapter
    richText.ts       # Tiptap Mount adapter; emits messages only
  media/
    model.ts          # Images, stickers, searches, picker submodels
    message.ts
    update.ts
    command.ts
  command.ts          # Entry/session RPC commands only, or re-export-free move
  rpc.ts
  draft.ts
```

`page/` remains rendering-only. Feature views receive their feature model and emit feature messages through root envelopes. Do not create compatibility re-exports or duplicate APIs.

## Root Model

```ts
type Model = {
  readonly route: AppRoute
  readonly calendar: Calendar.Model
  readonly entry: Entry.Model
  readonly canvas: Canvas.Model
  readonly media: Media.Model
}
```

Root message union contains only:

```ts
ChangedRoute
GotCalendarMessage
GotEntryMessage
GotCanvasMessage
GotMediaMessage
```

Each `Got*Message` wraps the exact child feature union. Root `update` delegates to feature update functions, maps child commands back to envelopes, and coordinates only cross-feature facts:

- route change starts calendar/entry loading;
- media selection creates a Canvas image/sticker element;
- confirmed media title starts upload;
- saved entry refreshes calendar previews.

## Rich-text correction

Replace imperative toolbar DOM mutations with Canvas state:

```ts
type ToolbarMenu = "font" | "size" | "color" | null

type Canvas.Model = {
  readonly elements: ReadonlyArray<CanvasElement>
  readonly selectedElementId: string | null
  readonly toolbarMenu: ToolbarMenu
}
```

Messages:

- `ToggledToolbarMenu`
- `ClosedToolbarMenu`
- `AppliedTextFormat`
- `ChangedTextDocument`
- existing selection/transform/delete events

The Tiptap Mount remains responsible only for editor construction, editor updates, and receiving declarative format events. It must not toggle classes, update labels, or listen globally for menu state. Toolbar labels/active options derive from the selected Canvas element document/style state. Click-outside emits `ClosedToolbarMenu` through a Foldkit Mount/subscription, not a raw DOM mutation.

## Migration phases

### 1. Establish behavior locks

Before moves, add/keep focused tests:

- calendar navigation and date preview;
- loading an empty entry creates one text Canvas Element;
- Canvas select/deselect, paste, transform, delete;
- rich-text format persistence and toolbar open/close;
- upload title confirmation before upload.

No source move until these pass.

### 2. Extract Canvas

Move element state, selected ID, text toolbar menu state, pure transforms, and Canvas messages into `core/canvas/`. Move pointer/paste/Tiptap mounts beside it. Root delegates Canvas messages.

Acceptance: Canvas Story and Scene tests pass; no Canvas state remains in root model/update.

### 3. Extract Media

Move gallery state, image/sticker popovers, file-drop submodels, search, emoji list, upload title dialog/pending upload, and media commands into `core/media/`.

Acceptance: image/sticker picker and upload tests pass; Canvas receives explicit media-ready messages rather than touching media state.

### 4. Extract Entry

Move entry load/save/draft state and commands into `core/entry/`. It owns server entry document hydration and save lifecycle; Canvas owns in-memory document edits.

Acceptance: save/reload and draft tests pass; `entryText`, `savedText`, `localDraft`, dialogs are absent from root.

### 5. Extract Calendar

Move month, selected/previewed date, mini-calendar picker state, entry previews, and calendar commands into `core/calendar/`.

Acceptance: calendar/responsive Scene tests pass; root retains only `route` and feature models.

### 6. Thin root and views

Create `core/app/` root orchestrator. Update page component signatures to receive feature models/messages instead of flat fields. Delete old flat core files only after all imports move.

Acceptance: root update is delegation/cross-feature coordination only; `bun run check`, `bun run test`, and `bun run build` pass.

## Constraints

- Preserve URL routes and RPC contracts.
- No new dependencies required.
- Keep DOM-dependent libraries at Foldkit Mount boundaries.
- Keep commands named and typed with result messages.
- One writer per phase; commit each completed extraction separately.
- Do not change visual behavior during structural phases, except rich-text state fixes required to remove imperative mutations.

## Commit sequence

1. `test(web): lock Canvas and rich-text behavior`
2. `refactor(web): isolate Canvas state machine`
3. `refactor(web): isolate media state machine`
4. `refactor(web): isolate entry state machine`
5. `refactor(web): isolate calendar state machine`
6. `refactor(web): compose feature state machines`
