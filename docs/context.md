# Dearly Diary

Dearly is a personal diary context for composing dated memories from text, images, stickers, and other visual elements.

## Language

**Diary**:
A private collection of dated memories owned by one person. Sharing may be added later, but it is not part of the first version.
_Avoid_: Journal, notebook

**Diary Entry**:
A single editable canvas for one calendar date. It can contain written text and visual elements arranged by the owner.
_Avoid_: Post, page, note

**Draft**:
A local-only working copy of a Diary Entry that preserves unsaved changes across browser sessions until the Owner saves or discards it.
_Avoid_: Autosave, cache

**Saved Entry**:
The cloud-persisted version of a Diary Entry that survives across devices.
_Avoid_: Published entry, committed entry

**Date Card**:
A clickable day cell in the month view. Every date in the selected month has a Date Card, whether or not it has a Draft or Saved Entry.
_Avoid_: Calendar tile, day box

**Entry Preview**:
A lightweight summary shown on a Date Card, using a short text snippet, at most one visual thumbnail, and a saved or unsaved marker.
_Avoid_: Canvas thumbnail, cover

**Canvas**:
The freeform scrapbook surface inside a Diary Entry where the Owner arranges text and visual elements.
_Avoid_: Document, editor page

**Canvas Element**:
A text, image, sticker, or similar item placed on a Canvas with its own position, size, and layer.
_Avoid_: Block, widget, object

**Staged Media**:
An image or similar file kept locally inside a Draft until the Owner saves the Diary Entry.
_Avoid_: Temporary upload, pending file

**Sticker**:
A reusable decorative image owned by the Owner and placed on one or more Canvases. Removing a Sticker from the picker does not remove existing canvas placements.
_Avoid_: Emoji, decal

**Owner**:
The person who owns a Diary and controls its entries and media. A verified Cloudflare Access JWT `sub` identifies the Owner.
_Avoid_: Account, member, author

**Image Gallery**:
A future view that gathers images from Diary Entries and lets the Owner browse them by their connected dates.
_Avoid_: Photo feed, media library
