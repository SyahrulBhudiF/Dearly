import { MediaObjectId, Unauthorized } from "@dearly/domain";
import { Effect, Option, Schema } from "effect";
import { json, type WorkerEffect } from "./libs/http";
import { getPrivateMedia } from "./modules/media";
import { getSession } from "./modules/session";
import type { WorkerContext } from "./types";

export const media = (request: Request, context: WorkerContext): WorkerEffect<Response> => {
  const id = decodeMediaId(request);
  if (Option.isNone(id)) {
    return json(404, { error: "NotFound", message: "Media not found" });
  }

  return getSession(context).pipe(
    Effect.flatMap(
      Option.match({
        onNone: () => json(401, new Unauthorized({ message: "Owner session is required" })),
        onSome: (owner) =>
          getPrivateMedia(context, owner, id.value).pipe(
            Effect.flatMap(
              Option.match({
                onNone: () => json(404, { error: "NotFound", message: "Media not found" }),
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

const decodeMediaId = (request: Request) => {
  const id = new URL(request.url).pathname.slice("/media/".length);
  return Schema.decodeUnknownOption(MediaObjectId)(id);
};
