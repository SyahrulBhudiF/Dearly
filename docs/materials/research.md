# Dearly Research Materials

Source notes for the Dearly diary app plan. These notes are implementation-facing; domain terms stay in `docs/context.md`.

## Product shape

- App: personal diary with a month calendar, fast day switching, and one editable freeform diary canvas per date.
- First version: one Owner, private entries, no sharing.
- Calendar view:
  - Each day is a Date Card.
  - Date Cards may show an Entry Preview: text snippet, one thumbnail, and saved/unsaved marker.
  - Neighboring months should be quickly clickable from the left/right month controls or adjacent visible date cards.
- Entry view:
  - Click a Date Card to open that date's Diary Entry.
  - Left circular tool rail creates Canvas Elements: image, sticker, rich text, possibly future element types.
  - Main area is a Canvas: draggable/resizable/layered scrapbook surface.
  - Local Draft must survive browser sessions until saved or discarded.
  - Saved Entry persists to cloud and survives across devices.

## Architecture materials

### Foldkit

Sources:

- https://foldkit.dev/core/architecture/
- https://foldkit.dev/core/getting-started/
- https://foldkit.dev/testing/

Key points:

- Foldkit is a TypeScript frontend framework built on Effect and The Elm Architecture.
- App state lives in one Model. Every change flows through Message -> update -> Model/Command -> view/runtime.
- Side effects are explicit Commands, not hidden imperative calls inside handlers.
- Mount is the integration seam for live DOM work. Use it for Canvas and Tiptap attachment points, drag observers, resize observers, and third-party editors.
- Subscriptions are model-scoped streams for ongoing browser input: pointer drag, keyboard shortcuts, online/offline state, viewport resize.
- ManagedResources fit long-lived resources controlled by model state, such as a temporary image decode worker or editor instance while a Diary Entry is open.
- Submodels are the scaling unit: calendar, entry canvas, tool rail, media picker, and rich text editor can each own a local Model/Message/update and surface typed OutMessages upward.
- Foldkit testing has two layers:
  - Story tests exercise pure update logic and Commands.
  - Scene tests exercise rendered user flows and accessibility.

Recommended Dearly mapping:

- Root model: session state, selected month/date, active route, current owner, current draft/saved-entry summaries.
- Calendar submodel: month navigation, focused Date Card, selection, preview loading state.
- Entry submodel: open date, draft snapshot, canvas elements, selection, active tool, dirty/saving state.
- Tool rail submodel: chosen insert mode and file/sticker/text actions.
- Canvas submodel: element selection, transforms, z-order, drag/resize state.
- Rich text element: Tiptap mounted through Foldkit Mount; editor changes emit Messages into the canvas update loop.

### Effect RPC / effect-smol / Alchemy

Sources:

- https://github.com/Effect-TS/effect-smol
- https://v2.alchemy.run/cloudflare/apis/effect-rpc/
- https://v2.alchemy.run/cloudflare/setup/
- https://v2.alchemy.run/cloudflare/

Key points:

- `effect-smol` is experimental Effect v4 work. Use it only if its package APIs match Foldkit/Alchemy examples at implementation time; otherwise pin compatible Effect packages used by Foldkit/Alchemy.
- Effect RPC exposes schema-validated procedures across the browser <-> Worker trust boundary.
- Recommended RPC shape:
  - Define schemas/errors in a shared package imported by both app and Worker.
  - Declare one `RpcGroup` value shared by client/server.
  - Construct handlers in the Worker's init phase, but do request-dependent work only inside per-request handlers.
  - Return the `fetch` produced by RPC server wiring.
- RPC errors should be schema-backed tagged errors so clients match domain failures, not raw HTTP status codes.
- Alchemy provisions Cloudflare resources and typed bindings: Worker, D1, R2, secrets, static assets.
- Alchemy setup can authenticate locally via OAuth or API token and stores deploy credentials in `~/.alchemy/profiles.json`; CI uses `CLOUDFLARE_ACCOUNT_ID` plus API token/key env vars.

Recommended API packages:

- `packages/domain`: Effect Schema classes/brands for OwnerId, DiaryEntryId, CanvasElementId, dates, entry documents, media metadata.
- `packages/rpc`: shared Effect RPC group and tagged errors.
- `apps/web`: Foldkit app and typed RPC client.
- `apps/worker`: Cloudflare Worker, RPC handlers, D1/R2 bindings, auth/session handling, static asset fallback.
- `infra`: Alchemy stack.

## Cloudflare free-tier materials

Sources:

- Workers limits: https://developers.cloudflare.com/workers/platform/limits/index.md
- Static assets: https://developers.cloudflare.com/workers/static-assets/index.md
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/index.md
- R2 limits: https://developers.cloudflare.com/r2/platform/limits/index.md
- R2 Workers API: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
- D1 Worker API: https://developers.cloudflare.com/d1/worker-api/

Important free-tier constraints:

- Workers Free:
  - 100,000 requests/day.
  - 10 ms CPU per HTTP request.
  - 128 MB memory per isolate.
  - 50 subrequests/request.
  - 6 simultaneous outgoing connections/request.
  - 3 MB Worker size.
  - Static assets can be uploaded with the Worker; individual asset limit is 25 MiB.
- Cloudflare account free request body limit: 100 MB.
- D1 Free:
  - 10 databases/account.
  - 500 MB maximum database size.
  - 5 GB maximum storage/account.
  - 50 queries per Worker invocation.
  - 2 MB maximum string/BLOB/row size.
  - 30 second maximum SQL query duration.
  - Each individual D1 database is single-threaded; index date/owner queries carefully.
- R2 platform limits:
  - Unlimited data storage per bucket and objects per bucket at platform level, but actual cost/free allowance must still be checked before launch.
  - Object max size: 5 TiB; single-part upload max: about 5 GiB.
  - Object metadata max: 8 KiB.
  - Same object key concurrent writes: 1/sec.
  - Public `r2.dev` endpoint is not for production; Dearly should serve private media through authenticated Worker routes.

Recommended Cloudflare shape:

- One Worker serves static web assets and `/rpc/*`/auth/media routes on same origin.
- One D1 database for app data in v1.
- One private R2 bucket for media originals and thumbnails.
- No Durable Objects in v1 unless collaborative editing or strict per-entry concurrency becomes required.
- Keep Canvas documents below D1 row limit by storing structured JSON in D1 and keeping binary media in R2.
- Generate thumbnails on upload or first view only if CPU stays inside free-tier limits; otherwise defer thumbnail generation to client-side before upload.

## Auth materials

Sources:

- Google OAuth web server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- GitHub OAuth web app flow: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

Resolved direction from ADR 0001:

- Use consumer OAuth providers, starting with Google and GitHub, not Cloudflare OAuth.
- Cloudflare OAuth is for Cloudflare account integration and would wrongly require diary users to own Cloudflare accounts.
- Same verified email from different OAuth providers identifies the same Owner.

Implementation notes:

- Use authorization-code flow with state/PKCE.
- Store provider identity records separately from Owner.
- Session cookie should be same-origin, HttpOnly, Secure, SameSite=Lax or Strict.
- Keep OAuth tokens only as long as needed to verify identity; first version does not need provider API access beyond identity/email.

## UI and rich text materials

Sources:

- Theme: https://tweakcn.com/themes/cmr5kll1g000004jxcs7c0gl5
- Tiptap editor API: https://tiptap.dev/docs/editor/api/editor

Theme observations:

- Theme name shown as CuteSpringTheme.
- Tags: gradient, pastel, soft, spring, warm.
- Good fit for “cute diary”: warm surfaces, rounded controls, playful iconography, soft contrast.
- Avoid making the product look like a generic dashboard. Use diary/scrapbook metaphors: paper cards, stickers, soft shadows, tape/pin details, but keep accessibility contrast and keyboard focus clear.

Tiptap notes:

- Tiptap `Editor` wraps ProseMirror and can be created with `element: null`, then mounted later.
- This matches Foldkit Mount: create/mount editor when text Canvas Element enters DOM; destroy on unmount.
- Tiptap content can be stored as JSON in the Canvas Element payload.
- Restrict first-version extensions to paragraph/text/basic marks unless richer controls are explicitly needed.

Recommended UI components:

- Month calendar with large Date Cards and clear selected/today/has-draft/has-saved states.
- Entry canvas with fixed logical coordinate system, zoom/pan later.
- Tool rail actions: add text, upload image, add sticker, select/move.
- Media picker panel for existing Stickers and staged uploads.
- Save/discard affordance visible when Draft is dirty.

## Monorepo materials

Sources:

- https://turborepo.dev/docs/getting-started/installation

Recommended structure:

```txt
apps/
  web/          # Foldkit app, Vite build, static assets
  worker/       # Cloudflare Worker runtime and RPC/auth/media routes
packages/
  domain/       # Effect Schema domain types
  rpc/          # shared RpcGroup and client/server payload schemas
  ui/           # theme tokens and reusable Foldkit UI pieces if needed
infra/
  alchemy.run.ts
  cloudflare.ts
docs/
  context.md
  adr/
  materials/
```

Turbo tasks:

- `build`: domain/rpc first, then web/worker.
- `check`: TypeScript and package checks.
- `test`: focused Foldkit Story/Scene tests and Worker handler tests.
- `dev`: run Worker dev server with web assets.
- `deploy`: Alchemy deployment.

## Open risks

- Foldkit and `effect-smol` are young/experimental. Pin versions early and avoid broad abstractions until a working skeleton proves compatibility.
- Free Worker CPU limit is tight. Keep server handlers mostly D1/R2 I/O and avoid image processing in Worker.
- D1 500 MB free database limit means binary files must never be stored in D1.
- Canvas editing needs a precise persistence model: Draft local state, staged media, and Save transaction order must be designed carefully to avoid orphaned R2 objects or lost local work.
