# Deploy

## Prerequisites

- [Bun](https://bun.sh) v1.3+
- [Cloudflare](https://cloudflare.com) account with:
  - Workers Paid plan (for D1 + R2 + Access)
  - A domain configured on Cloudflare

## Secrets

These must be set as [GitHub Actions secrets](https://github.com/elianiva/Dearly/settings/secrets/actions):

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers, D1, R2, Access permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `DEARLY_DOMAIN` | Domain the app will live at (e.g. `dearly.example.com`) |
| `CF_ACCESS_OWNER_EMAILS` | Comma-separated emails allowed to access the app via Cloudflare Access |
| `CF_ACCESS_TEAM_DOMAIN` | Cloudflare Access team domain URL (e.g. `https://dearly.cloudflareaccess.com`) |

## Manual deploy

```sh
# Build everything, then deploy the worker
# (worker serves web/dist as static assets)
bun run deploy
```

Required env vars for manual deploy:

| Variable | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `DEARLY_DOMAIN` | Domain for the app |
| `CF_ACCESS_OWNER_EMAILS` | Comma-separated emails |
| `CF_ACCESS_TEAM_DOMAIN` | Cloudflare Access team domain |
| `APP_ENV` | Set to `production` |

Optional:

| Variable | Default | Description |
|---|---|---|
| `TIME_ZONE` | `Asia/Jakarta` | Timezone for date-related features |
| `DEV_OWNER_ID` | — | Owner ID override for local dev |
