import { describe, expect, it } from "vitest";
import { isoWeekOf, isoWeekOfDate, lastIsoWeeks, TRACKER_TIME_ZONE } from "./weeks";

describe("isoWeekOfDate", () => {
  it.each([
    // 2026-01-01 is a Thursday, so week 1 starts on Monday 2025-12-29.
    [{ year: 2026, month: 1, day: 1 }, "2026-W01", "2025-12-29"],
    [{ year: 2026, month: 10, day: 27 }, "2026-W44", "2026-10-26"],
    // 2026 has 53 ISO weeks; 2027-01-01 (Friday) still belongs to 2026-W53.
    [{ year: 2026, month: 12, day: 31 }, "2026-W53", "2026-12-28"],
    [{ year: 2027, month: 1, day: 1 }, "2026-W53", "2026-12-28"],
    [{ year: 2027, month: 1, day: 4 }, "2027-W01", "2027-01-04"],
  ])("%j -> %s starting %s", (date, key, weekStart) => {
    expect(isoWeekOfDate(date)).toEqual({ key, weekStart });
  });
});

describe("isoWeekOf (time zones)", () => {
  it("uses the Fredericton calendar date, not UTC", () => {
    // Monday 02:30 UTC is Sunday 22:30 in Atlantic Standard Time (UTC-4).
    const instant = new Date("2026-11-02T02:30:00Z");
    expect(isoWeekOf(instant, "UTC").key).toBe("2026-W45");
    expect(isoWeekOf(instant, TRACKER_TIME_ZONE).key).toBe("2026-W44");
  });

  it("handles daylight saving time (UTC-3 in summer)", () => {
    // Monday 02:30 UTC is Sunday 23:30 in Atlantic Daylight Time.
    expect(isoWeekOf(new Date("2026-10-26T02:30:00Z"), TRACKER_TIME_ZONE).key).toBe("2026-W43");
  });
});

describe("lastIsoWeeks", () => {
  it("returns 12 consecutive weeks ending with the current one", () => {
    const weeks = lastIsoWeeks(new Date("2026-10-27T15:00:00Z"), 12, TRACKER_TIME_ZONE);
    expect(weeks).toHaveLength(12);
    expect(weeks[0]).toEqual({ key: "2026-W33", weekStart: "2026-08-10" });
    expect(weeks[11]).toEqual({ key: "2026-W44", weekStart: "2026-10-26" });
  });
});
