# Serve the app and API from one Worker

Dearly deploys as a single Cloudflare Worker that serves static frontend assets and handles Effect RPC routes on the same origin. This keeps auth cookies same-origin, avoids CORS, and fits the free-tier deployment model while still allowing the monorepo to separate frontend, RPC contract, and infrastructure packages.
