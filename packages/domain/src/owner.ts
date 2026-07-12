import { Schema } from "effect";
import { OwnerId } from "./ids";

export const OwnerSession = Schema.Struct({
  ownerId: OwnerId,
  email: Schema.String.check(Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  displayName: Schema.optional(Schema.String),
});
export type OwnerSession = Schema.Schema.Type<typeof OwnerSession>;
