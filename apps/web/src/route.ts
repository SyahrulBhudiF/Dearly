import { Schema } from "effect";
import { CalendarDate } from "@dearly/domain";
import { Route } from "foldkit";

export const CalendarRoute = Route.r("CalendarRoute");
export const EntryRoute = Route.r("EntryRoute", { date: CalendarDate });
export const NotFoundRoute = Route.r("NotFoundRoute", { path: Schema.String });

export const AppRoute = Schema.Union([CalendarRoute, EntryRoute, NotFoundRoute]);
export type AppRoute = Schema.Schema.Type<typeof AppRoute>;

export const calendarRouter = Route.mapTo(CalendarRoute)(Route.root);
export const entryRouter = Route.mapTo(EntryRoute)(
  Route.slash(Route.schemaSegment("date", CalendarDate))(Route.literal("entry")),
);
export const parseRoute = Route.parseUrlWithFallback(Route.oneOf(entryRouter, calendarRouter), NotFoundRoute);
