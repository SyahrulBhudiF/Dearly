import { Schema } from "effect";
import { OwnerId } from "./ids";

export const OwnerSession = Schema.Struct({ ownerId: OwnerId });
export type OwnerSession = typeof OwnerSession.Type;
