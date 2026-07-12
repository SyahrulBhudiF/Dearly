import type { Html } from "foldkit";
import type { Model } from "./core/model";
import { calendarPage } from "./page/calendar";
import { entryPage } from "./page/entry";

export const view = (model: Model): Html.Document => {
  switch (model.route._tag) {
    case "CalendarRoute":
      return calendarPage(model);
    case "EntryRoute":
      return entryPage(model);
    case "NotFoundRoute":
      return calendarPage(model);
  }
};
