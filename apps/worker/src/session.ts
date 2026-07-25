import { OwnerSession, OwnerSession as OwnerSessionSchema, Unauthorized } from "@dearly/domain";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { Effect, Option, Schema } from "effect";
import { RequestService } from "./services/appLayer";
import { ConfigService, type AppConfig } from "./services/config";

const jwksByUrl = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export const getSession = Effect.gen(function* () {
  const config = yield* ConfigService;
  const request = yield* RequestService;
  const identity = yield* getIdentity(config, request);
  return Option.flatMap(identity, toSession);
});

const getIdentity = (config: AppConfig, request: Request) =>
  config.appEnv !== "production"
    ? Effect.succeed(Option.map(config.devOwnerId, (subject): AccessIdentity => ({ subject })))
    : Option.match(config.access, {
        onNone: () => Effect.succeed(Option.none<AccessIdentity>()),
        onSome: ({ aud, teamDomain }) =>
          Effect.tryPromise(() =>
            jwtVerify(request.headers.get("cf-access-jwt-assertion") ?? "", jwks(teamDomain), {
              issuer: teamDomain,
              audience: aud,
            }),
          ).pipe(
            Effect.map(({ payload }) => parseAccessIdentity(payload)),
            Effect.catch((error) =>
              Effect.logError("[getIdentity] JWT verification failed", error).pipe(
                Effect.as(Option.none<AccessIdentity>()),
              ),
            ),
          ),
      });

const jwks = (teamDomain: string) => {
  const url = `${teamDomain}/cdn-cgi/access/certs`;
  const existing = jwksByUrl.get(url);
  if (existing !== undefined) return existing;

  const remote = createRemoteJWKSet(new URL(url));
  jwksByUrl.set(url, remote);
  return remote;
};

const AccessIdentity = Schema.Struct({ subject: Schema.String });
type AccessIdentity = typeof AccessIdentity.Type;

const parseAccessIdentity = (payload: JWTPayload): Option.Option<AccessIdentity> =>
  Schema.decodeUnknownOption(AccessIdentity)({ subject: payload.sub });

const toSession = ({ subject }: AccessIdentity): Option.Option<OwnerSession> =>
  Schema.decodeUnknownOption(OwnerSessionSchema)({ ownerId: subject });

export const requireOwner = Effect.gen(function* () {
  const session = yield* getSession;
  return yield* Option.match(session, {
    onNone: () => Effect.fail(new Unauthorized({ message: "Owner session is required" })),
    onSome: Effect.succeed,
  });
});
