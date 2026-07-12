import { BadRequest, MediaNotFound, MediaObjectId, NotFound, Unauthorized } from "@dearly/domain";
import { Effect, Option, Schema } from "effect";
import { json, type WorkerEffect } from "./libs/http";
import { getPrivateMedia, uploadPrivateMedia } from "./modules/media";
import { getSession } from "./modules/session";
import type { WorkerContext } from "./types";

export const media = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const id = decodeMediaId(request);
  if (Option.isNone(id)) {
    return Effect.fail(new NotFound({ message: "Media not found" }));
  }

  return getSession(context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => Effect.fail(new Unauthorized({ message: "Owner session is required" })),
        onSome: (owner) =>
          request.method === "POST"
            ? uploadMedia(request, context, owner, id.value)
            : getPrivateMedia(context, owner, id.value).pipe(
                Effect.flatMap(
                  Option.match({
                    onNone: () =>
                      Effect.fail(
                        new MediaNotFound({ mediaObjectId: id.value, message: "Media not found" }),
                      ),
                    onSome: ({ body, mimeType }) =>
                      Effect.succeed(
                        new Response(body.body, {
                          status: 200,
                          headers: {
                            "content-type": mimeType,
                            "cache-control": "private, max-age=3600",
                            "x-content-type-options": "nosniff",
                          },
                        }),
                      ),
                  }),
                ),
              ),
      }),
    ),
  );
};

const uploadMedia = (
  request: Request,
  context: WorkerContext,
  owner: Parameters<typeof uploadPrivateMedia>[1],
  id: MediaObjectId,
) => {
  if (request.body === null) {
    return Effect.fail(new BadRequest({ message: "Missing upload body" }));
  }

  return uploadPrivateMedia(context, owner, id, request.body).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () =>
          Effect.fail(new MediaNotFound({ mediaObjectId: id, message: "Media not found" })),
        onSome: (mediaObject) => json(200, mediaObject),
      }),
    ),
  );
};

const decodeMediaId = (request: Request) => {
  const id = new URL(request.url).pathname.slice("/media/".length);
  return Schema.decodeUnknownOption(MediaObjectId)(id);
};
