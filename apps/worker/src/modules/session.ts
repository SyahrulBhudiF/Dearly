import { OwnerSession, OwnerSession as OwnerSessionSchema } from "@dearly/domain";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { Effect, Option, Schema } from "effect";
import type { WorkerEffect } from "../libs/http";
import type { WorkerContext } from "../types";

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export const getSession = (context: WorkerContext): WorkerEffect<Option.Option<OwnerSession>> =>
  identity(context).pipe(Effect.map(Option.map(toSession)));

const identity = (context: WorkerContext): Effect.Effect<Option.Option<AccessIdentity>> => {
  if (context.config.appEnv !== "production") {
    return Effect.succeed(Option.map(context.config.devOwnerId, (subject) => ({ subject })));
  }

  return Option.match(context.config.access, {
    onNone: () => Effect.succeed(Option.none()),
    onSome: ({ aud, teamDomain }) =>
      Effect.tryPromise(() =>
        jwtVerify(context.request.headers.get("cf-access-jwt-assertion") ?? "", jwks(teamDomain), {
          issuer: teamDomain,
          audience: aud,
        }),
      ).pipe(
        Effect.map(({ payload }) => accessIdentity(payload)),
        Effect.catch(() => Effect.succeed(Option.none())),
      ),
  });
};

const jwks = (teamDomain: string) => {
  const url = `${teamDomain}/cdn-cgi/access/certs`;
  const existing = jwksByUrl.get(url);
  if (existing !== undefined) return existing;

  const remote = createRemoteJWKSet(new URL(url));
  jwksByUrl.set(url, remote);
  return remote;
};

const accessIdentity = (payload: JWTPayload): Option.Option<AccessIdentity> =>
  Schema.decodeUnknownOption(AccessIdentity)({ subject: payload.sub });

const toSession = ({ subject }: AccessIdentity): OwnerSession =>
  Schema.decodeUnknownSync(OwnerSessionSchema)({ ownerId: subject });

const AccessIdentity = Schema.Struct({ subject: Schema.String });
type AccessIdentity = Schema.Schema.Type<typeof AccessIdentity>;
