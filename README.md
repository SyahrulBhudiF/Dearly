# Dearly

A private diary for composing dated memories on a freeform canvas.

## Screenshots

| Calendar                                     | Canvas toolbar                                                   |
| -------------------------------------------- | ---------------------------------------------------------------- |
| ![Calendar](public/screenshots/calendar.png) | ![Canvas toolbar](public/screenshots/canvas-toolbar.png) |

| Image picker                                         | Stickers & emoji                                         |
| ---------------------------------------------------- | -------------------------------------------------------- |
| ![Image picker](public/screenshots/image-picker.png) | ![Sticker picker](public/screenshots/sticker-picker.png) |

| Canvas layers                                                      | Emoji picker                                           |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| ![Canvas layers panel](public/screenshots/canvas-layers.png) | ![Emoji picker](public/screenshots/emoji-picker.png) |

| Photo preview                                                        |
| -------------------------------------------------------------------- |
| ![Photo preview](public/screenshots/photo-preview.png)               |

## Features

- Private daily diary with calendar navigation.
- Two calendars: the small sidebar calendar is for browsing photos, the large main calendar is for opening and editing entries.
- Freeform canvas for mixing text, images, stickers, emoji, and shapes.
- Rich text formatting with font, size, color, alignment, bold, italic, and underline.
- Layer ordering to control what sits in front or behind.
- Move, resize, rotate, and delete canvas elements.
- Canvas-wide Undo and Redo.
- Copy and paste text and images directly into the canvas.
- Local draft saving before final save.
- Photo preview modal with download from saved canvas snapshots.

## Stack

Cloudflare Workers, D1, R2, Effect, Foldkit, TypeScript, Bun, and Turbo.

## Local development

```bash
bun install
bun run dev
```

```bash
bun run check
bun run test
```
