import { describe, expect, it } from "vitest";
import { statsSummary } from "./statsSummary";

const now = new Date("2026-10-26T12:00:00Z");

describe("statsSummary", () => {
  it("lists totals per source with thousands separators and when data was last updated", () => {
    expect(
      statsSummary(
        {
          openJobs: 1234,
          openJobsBySource: { MANUAL: 14, GREENHOUSE: 1100, LEVER: 120 },
          lastSuccessfulIngestAt: "2026-10-26T10:00:00Z",
        },
        now,
      ),
    ).toBe("1,234 open jobs · 1,100 from Greenhouse · 120 from Lever · 14 posted here · updated 2 hours ago");
  });

  it("leaves out empty sources and a missing last run", () => {
    expect(
      statsSummary(
        { openJobs: 1, openJobsBySource: { MANUAL: 1, GREENHOUSE: 0, LEVER: 0 }, lastSuccessfulIngestAt: null },
        now,
      ),
    ).toBe("1 open job · 1 posted here");
  });
});
