import { Schema } from "effect";
import { EntryPreview, OwnerSession } from "@dearly/domain";

export const Model = Schema.Struct({
  month: Schema.String,
  selectedDate: Schema.String,
  pickerOpen: Schema.Boolean,
  pickerYear: Schema.Number,
  photoPreviewOpen: Schema.Boolean,
  entries: Schema.Array(EntryPreview),
  session: Schema.NullOr(OwnerSession),
  loadState: Schema.Literals(["idle", "loading", "failed"]),
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (selectedDate: string): Model => ({
  month: selectedDate.slice(0, 7),
  selectedDate,
  pickerOpen: false,
  pickerYear: Number(selectedDate.slice(0, 4)),
  photoPreviewOpen: false,
  entries: [],
  session: null,
  loadState: "idle",
});
