const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["week", 7 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// "just now", "5 minutes ago", "yesterday", "3 weeks ago", ... for a past
// ISO date. Uses the largest unit that fits (months are 30 days).
export const formatRelativeTime = (iso: string, now: Date = new Date()) => {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.trunc(seconds / unitSeconds), unit);
    }
  }
  return "just now";
};
