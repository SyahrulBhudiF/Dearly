import { Schema } from "effect";

export const Kind = Schema.Literals(["success", "error", "loading"]);
export type Kind = Schema.Schema.Type<typeof Kind>;

export const Model = Schema.Struct({
  id: Schema.String,
  kind: Kind,
  message: Schema.String,
});
export type Model = Schema.Schema.Type<typeof Model>;
