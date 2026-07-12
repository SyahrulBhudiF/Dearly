import { Schema } from "effect";

export const CalendarDate = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/)).pipe(
  Schema.brand("@Dearly/CalendarDate"),
);
export type CalendarDate = Schema.Schema.Type<typeof CalendarDate>;

export const CalendarMonth = Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}$/)).pipe(
  Schema.brand("@Dearly/CalendarMonth"),
);
export type CalendarMonth = Schema.Schema.Type<typeof CalendarMonth>;
