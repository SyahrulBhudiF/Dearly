import { Schema } from "effect";
import { today } from "../../libs/date";
import { CalendarRoute, EntryRoute, NotFoundRoute, type AppRoute } from "../route";
import * as Calendar from "../calendar/model";
import * as Canvas from "../canvas/model";
import * as Entry from "../entry/model";
import * as Media from "../media/model";

export const Model = Schema.Struct({
  route: Schema.Union([CalendarRoute, EntryRoute, NotFoundRoute]),
  calendar: Calendar.Model,
  entry: Entry.Model,
  canvas: Canvas.Model,
  media: Media.Model,
});
export type Model = Schema.Schema.Type<typeof Model>;

export const initialModel = (route: AppRoute): Model => {
  const selectedDate = "date" in route ? route.date : today();
  return {
    route,
    calendar: Calendar.initialModel(selectedDate),
    entry: Entry.initialModel(),
    canvas: Canvas.initialModel(),
    media: Media.initialModel(),
  };
};
