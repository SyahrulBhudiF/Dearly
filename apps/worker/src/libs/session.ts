import { Option } from "effect";

export const SESSION_COOKIE = "dearly_session";
const cookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export const sessionIdFromRequest = (request: Request): Option.Option<string> => {
  const cookie = request.headers.get("cookie");
  if (cookie === null) {
    return Option.none();
  }

  const session = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (session === undefined) {
    return Option.none();
  }

  return Option.some(decodeURIComponent(session.slice(SESSION_COOKIE.length + 1)));
};

export const sessionCookie = (sessionId: string): string =>
  `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Max-Age=${cookieMaxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Lax`;

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
