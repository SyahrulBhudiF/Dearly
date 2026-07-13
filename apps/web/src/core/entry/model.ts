import { Schema } from "effect";
import { Dialog } from "@foldkit/ui";

export const Model = Schema.Struct({
  text: Schema.String,
  savedText: Schema.String,
  localDraft: Schema.NullOr(Schema.String),
  loadState: Schema.Literals(["idle", "loading", "failed"]),
  saveState: Schema.Literals(["idle", "saving", "failed"]),
  discardDialog: Dialog.Model,
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (): Model => ({
  text: "",
  savedText: "",
  localDraft: null,
  loadState: "idle",
  saveState: "idle",
  discardDialog: Dialog.init({ id: "discard-entry" }),
});
