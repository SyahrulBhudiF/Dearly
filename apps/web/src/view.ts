import type { Html } from "foldkit";
import type { Model } from "./core/app/model";
import { calendarPage } from "./page/calendar";
import { entryPage } from "./page/entry";

export const view = (model: Model): Html.Document => {
  switch (model.route._tag) {
    case "CalendarRoute":
      return calendarPage(model.calendar, model.notifications);
    case "EntryRoute":
      return entryPage(model);
    case "NotFoundRoute":
      return calendarPage(model.calendar, model.notifications);
  }
};
