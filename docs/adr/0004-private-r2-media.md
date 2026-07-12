# Serve diary media through authenticated Worker routes

Dearly stores images and stickers as private R2 objects and serves them through Worker routes that check the Owner session. Media URLs must not be public-by-knowledge; thumbnails may be cached separately for fast previews, but access still flows through authenticated application routes.
