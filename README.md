# Dearly

A private personal diary. Compose dated memories from text, images, and stickers on a freeform canvas.

## Tech Stack

- **Runtime**: Cloudflare Workers (free tier)
- **Language**: TypeScript (strict, ESM)
- **Framework**: Effect-TS for typed RPC, schemas, and error handling
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (private media)
- **Auth**: Consumer OAuth (Google, GitHub)
- **Build**: Bun + TurboRepo
- **Frontend**: Foldkit + Vite

## Getting Started

```bash
bun install
bun run build
bun run test
```

## Development

```bash
cd apps/worker
bun run dev
```

## Project Structure

```
apps/
  worker/       → Cloudflare Worker (API, auth, media, static assets)
packages/
  domain/       → Effect Schema types, branded IDs, tagged errors
  rpc/          → Shared RPC procedure definitions
docs/
  context.md    → Domain language glossary
  plan.md       → Implementation plan
  adr/          → Architecture Decision Records
```

## License

Private — not open source.
