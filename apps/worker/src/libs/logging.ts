import { Config, Effect, Layer, Logger, References } from "effect";

const makeLoggingLive = Effect.gen(function* () {
  const appEnv = yield* Config.string("APP_ENV").pipe(Config.withDefault("development"));
  const minLevel = appEnv === "production" ? "Info" as const : "Debug" as const;

  return Logger.layer([Logger.consoleJson]).pipe(
    Layer.provideMerge(Layer.succeed(References.MinimumLogLevel, minLevel)),
  );
});

export const LoggingLive = Layer.unwrap(makeLoggingLive);
