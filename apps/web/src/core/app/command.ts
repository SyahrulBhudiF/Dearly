import { Effect, Schema } from "effect";
import { Command } from "foldkit";
import { load, pushUrl } from "foldkit/navigation";
import { CompletedLoadExternal, CompletedNavigateInternal } from "./message";

export const NavigateInternal = Command.define(
  "NavigateInternal",
  { url: Schema.String },
  CompletedNavigateInternal,
)(({ url }) => pushUrl(url).pipe(Effect.as(CompletedNavigateInternal())));

export const LoadExternal = Command.define(
  "LoadExternal",
  { href: Schema.String },
  CompletedLoadExternal,
)(({ href }) => load(href).pipe(Effect.as(CompletedLoadExternal())));
