import { Schema } from "effect";

export const Model = Schema.Struct({
  text: Schema.String,
  savedText: Schema.String,
  localDraft: Schema.NullOr(Schema.String),
  loadState: Schema.Literals(["idle", "loading", "failed"]),
  saveState: Schema.Literals(["idle", "saving", "failed"]),
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (): Model => ({
  text: "",
  savedText: "",
  localDraft: null,
  loadState: "idle",
  saveState: "idle",
});
