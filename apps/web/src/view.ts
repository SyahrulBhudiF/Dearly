import { Match } from "effect";
import type { Html } from "foldkit";
import type { Model } from "./core/app/model";
import { calendarPage } from "./page/calendar";
import { entryPage } from "./page/entry";

export const view = (model: Model): Html.Document =>
  Match.value(model.route).pipe(
    Match.withReturnType<Html.Document>(),
    Match.tagsExhaustive({
      CalendarRoute: () => calendarPage(model.calendar, model.notifications),
      EntryRoute: () => entryPage(model),
      NotFoundRoute: () => calendarPage(model.calendar, model.notifications),
    }),
  );
