// ISO 8601 weeks (Monday to Sunday) cut in a given time zone, using only
// the built-in Intl API.

// Fredericton, NB (Atlantic time, with daylight saving).
export const TRACKER_TIME_ZONE = "America/Moncton";

const DAY_MS = 24 * 60 * 60 * 1000;

type CalendarDate = { year: number; month: number; day: number };

// The calendar date an instant falls on in `timeZone`.
export const calendarDateIn = (instant: Date, timeZone: string): CalendarDate => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
};

const pad = (value: number) => String(value).padStart(2, "0");

export type IsoWeek = {
  // e.g. "2026-W44"
  key: string;
  // Monday of the week, "YYYY-MM-DD".
  weekStart: string;
};

// ISO week of a calendar date. Weeks start on Monday, and week 1 is the
// week containing the year's first Thursday (so 2026-12-31 can be in 2026-W53
// and 2027-01-01 in 2026-W53 too).
export const isoWeekOfDate = ({ year, month, day }: CalendarDate): IsoWeek => {
  const date = Date.UTC(year, month - 1, day);
  const mondayOffset = (new Date(date).getUTCDay() + 6) % 7;
  const monday = date - mondayOffset * DAY_MS;
  const isoYear = new Date(monday + 3 * DAY_MS).getUTCFullYear();
  const jan4 = Date.UTC(isoYear, 0, 4);
  const week1Monday = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY_MS;
  const week = 1 + Math.round((monday - week1Monday) / (7 * DAY_MS));
  const mondayDate = new Date(monday);
  return {
    key: `${isoYear}-W${pad(week)}`,
    weekStart: `${mondayDate.getUTCFullYear()}-${pad(mondayDate.getUTCMonth() + 1)}-${pad(mondayDate.getUTCDate())}`,
  };
};

export const isoWeekOf = (instant: Date, timeZone: string) => isoWeekOfDate(calendarDateIn(instant, timeZone));

// The `count` ISO weeks ending with the week containing `now`, oldest first.
export const lastIsoWeeks = (now: Date, count: number, timeZone: string): IsoWeek[] => {
  const { weekStart } = isoWeekOf(now, timeZone);
  const [year, month, day] = weekStart.split("-").map(Number) as [number, number, number];
  const currentMonday = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, index) => {
    const monday = new Date(currentMonday - (count - 1 - index) * 7 * DAY_MS);
    return isoWeekOfDate({ year: monday.getUTCFullYear(), month: monday.getUTCMonth() + 1, day: monday.getUTCDate() });
  });
};
