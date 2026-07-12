# Serve diary media through authenticated Worker routes

Dearly stores images and stickers as private R2 objects and serves them through Worker routes that check the Owner session. Media URLs must not be public-by-knowledge; thumbnails may be cached separately for fast previews, but access still flows through authenticated application routes.

Uploads use the Worker as an authenticated proxy for now: `createMediaUpload` creates D1 metadata and returns `/media/:id`; the client `POST`s bytes to that route; the Worker streams the request body to R2 after checking owner access. This avoids presigned URL plumbing until file sizes or Worker bandwidth make direct-to-R2 uploads worthwhile.

Guardrails: cap upload metadata at 10 MiB, allow only common image MIME types, keep R2 private, store object metadata in D1, and never expose public R2 URLs.
