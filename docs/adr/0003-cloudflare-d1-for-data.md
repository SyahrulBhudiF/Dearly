# Use Cloudflare D1 for application data

Dearly stores Diary Entries, canvas state, previews, sticker metadata, and R2 object metadata in Cloudflare D1. Ownership uses the verified Cloudflare Access JWT `sub`; no local identity tables are needed. D1 fits the Worker-hosted architecture, stays within the Cloudflare free-tier model, avoids cross-service auth/network complexity, and is sufficient for date-indexed personal diary data.
