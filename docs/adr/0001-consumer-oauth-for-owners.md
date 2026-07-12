# Use Cloudflare Access for Owners

Cloudflare Access protects the whole application and verifies its signed JWT again in the Worker. Access policy owns admission; its verified JWT `sub` is the Owner ID on every persisted row. The application has no OAuth callback, app session cookie, session table, or local owner table.

The Access policy is provisioned in `infra/alchemy.run.ts`; do not edit it manually in the Cloudflare dashboard.
