import { describe, expect, it } from "vitest";
import type { ApplicationStage } from "@fredericton-grad-jobs/shared";
import { computeApplicationStats, type ApplicationForStats } from "./stats";
import { TRACKER_TIME_ZONE } from "./weeks";

const app = (stage: ApplicationStage, history: ApplicationStage[], appliedAt: string | null): ApplicationForStats => ({
  stage,
  appliedAt: appliedAt ? new Date(appliedAt) : null,
  events: history.map((toStage) => ({ toStage })),
});

// "Now" is Tuesday 2026-10-27, 11:00 in Fredericton (ISO week 2026-W44).
const now = new Date("2026-10-27T15:00:00Z");

// Known fixture: each line says which totals it adds to.
const fixture: ApplicationForStats[] = [
  /* A */ app("SAVED", ["SAVED"], null), // not applied
  /* B */ app("APPLIED", ["SAVED", "APPLIED"], "2026-10-26T16:00:00Z"), // reached; W44
  /* C */ app("INTERVIEW", ["SAVED", "APPLIED", "OA", "INTERVIEW"], "2026-10-14T16:00:00Z"), // reached, responded; W42
  /* D */ app("REJECTED", ["APPLIED", "REJECTED"], "2026-10-05T16:00:00Z"), // reached, responded; W41
  /* E */ app("OFFER", ["INTERVIEW", "OFFER"], "2026-09-30T16:00:00Z"), // added at INTERVIEW: reached, responded; W40
  /* F */ app("WITHDRAWN", ["SAVED", "WITHDRAWN"], null), // withdrawn before applying: not reached
  /* G */ app("WITHDRAWN", ["SAVED", "APPLIED", "WITHDRAWN"], "2026-02-02T16:00:00Z"), // reached; outside the 12 weeks
  /* H */ app("REJECTED", ["SAVED", "REJECTED"], "2026-10-27T13:00:00Z"), // straight to REJECTED: reached, responded; W44
  /* I */ app("APPLIED", ["APPLIED"], "2026-10-26T02:30:00Z"), // Sunday 23:30 in Fredericton: W43, not W44
];

describe("computeApplicationStats", () => {
  const stats = computeApplicationStats(fixture, now, TRACKER_TIME_ZONE);

  it("counts applications by current stage", () => {
    expect(stats.countsByStage).toEqual({
      SAVED: 1,
      APPLIED: 2,
      OA: 0,
      INTERVIEW: 1,
      OFFER: 1,
      REJECTED: 2,
      WITHDRAWN: 2,
    });
  });

  it("computes the response rate from stage history", () => {
    // Reached APPLIED: B, C, D, E, G, H, I = 7. Responded: C, D, E, H = 4.
    expect(stats.reachedApplied).toBe(7);
    expect(stats.responded).toBe(4);
    expect(stats.responseRate).toBeCloseTo(4 / 7, 10);
  });

  it("builds the funnel from the furthest stage each application reached", () => {
    expect(stats.funnel).toEqual([
      { stage: "SAVED", count: 9 },
      { stage: "APPLIED", count: 7 },
      { stage: "OA", count: 2 }, // C, E
      { stage: "INTERVIEW", count: 2 }, // C, E
      { stage: "OFFER", count: 1 }, // E
    ]);
  });

  it("counts applications per ISO week in Fredericton time for the last 12 weeks", () => {
    expect(stats.weekly).toHaveLength(12);
    const nonZero = stats.weekly.filter((week) => week.count > 0);
    expect(nonZero).toEqual([
      { week: "2026-W40", weekStart: "2026-09-28", count: 1 }, // E
      { week: "2026-W41", weekStart: "2026-10-05", count: 1 }, // D
      { week: "2026-W42", weekStart: "2026-10-12", count: 1 }, // C
      { week: "2026-W43", weekStart: "2026-10-19", count: 1 }, // I
      { week: "2026-W44", weekStart: "2026-10-26", count: 2 }, // B, H
    ]);
    expect(stats.timeZone).toBe("America/Moncton");
  });

  it("returns a null response rate and zero counts with no applications", () => {
    const empty = computeApplicationStats([], now, TRACKER_TIME_ZONE);
    expect(empty.responseRate).toBeNull();
    expect(empty.reachedApplied).toBe(0);
    expect(empty.weekly.every((week) => week.count === 0)).toBe(true);
    expect(empty.funnel.every((step) => step.count === 0)).toBe(true);
  });
});
