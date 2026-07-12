# Use consumer OAuth for Owners

Owners sign in through consumer OAuth providers, starting with Google and GitHub, instead of Cloudflare OAuth. Cloudflare OAuth is for integrating with Cloudflare accounts and would wrongly require diary users to own Cloudflare accounts; the app still keeps identities provider-neutral so additional providers can be added later.
