import {
  addDays,
  addMonths,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export const today = () => format(new Date(), "yyyy-MM-dd");

export const monthDays = (month: string) => {
  const firstDay = startOfMonth(parseISO(`${month}-01`));
  const firstMonday = startOfWeek(firstDay, { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, index) =>
    format(addDays(firstMonday, index), "yyyy-MM-dd"),
  );
};

export const monthLabel = (month: string) => format(parseISO(`${month}-01`), "MMMM yyyy");
export const previousMonth = (month: string) =>
  format(subMonths(parseISO(`${month}-01`), 1), "yyyy-MM");
export const nextMonth = (month: string) =>
  format(addMonths(parseISO(`${month}-01`), 1), "yyyy-MM");
export const dateLabel = (date: string) => format(parseISO(date), "d MMMM yyyy");
export const weekdayLabel = (date: string) => format(parseISO(date), "EEEE");
