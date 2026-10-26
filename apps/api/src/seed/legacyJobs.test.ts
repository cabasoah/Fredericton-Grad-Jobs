import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertJobType, convertLegacyJob, LegacyJobsFileSchema, parseSalaryRange } from "./legacyJobs";

describe("parseSalaryRange", () => {
  it.each([
    ["$70K - $80K", 70_000, 80_000],
    ["$100K - $110K", 100_000, 110_000],
    ["$50K - 60K", 50_000, 60_000],
    ["Under $50K", null, 50_000],
    ["Over $200K", 200_000, null],
  ])("parses %s", (input, salaryMin, salaryMax) => {
    expect(parseSalaryRange(input)).toEqual({ salaryMin, salaryMax });
  });

  it.each(["", "Competitive", "$80K - $70K", "$70K - $80K - $90K"])("rejects %j", (input) => {
    expect(() => parseSalaryRange(input)).toThrow("Unrecognised salary");
  });
});

describe("convertJobType", () => {
  it("maps the old Remote type to a full-time remote job", () => {
    expect(convertJobType("Remote")).toEqual({ type: "FULL_TIME", remote: "REMOTE" });
    expect(convertJobType("Part-Time")).toEqual({ type: "PART_TIME", remote: "ONSITE" });
    expect(() => convertJobType("Contract")).toThrow();
  });
});

describe("prisma/seed-data/jobs.json", () => {
  it("parses and converts every job", () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL("../../prisma/seed-data/jobs.json", import.meta.url), "utf8"),
    );
    const { jobs } = LegacyJobsFileSchema.parse(raw);
    expect(jobs.length).toBeGreaterThan(0);
    for (const job of jobs) {
      expect(() => convertLegacyJob(job)).not.toThrow();
    }
  });

  it("converts the first seed job as expected", () => {
    const converted = convertLegacyJob({
      id: "1",
      title: "Senior React Developer",
      type: "Full-Time",
      description: "Desc",
      location: "Boston, MA",
      salary: "$70K - $80K",
      company: {
        name: "NewTek Solutions",
        description: "About",
        contactEmail: "contact@teksolutions.com",
        contactPhone: "",
      },
    });
    expect(converted).toEqual({
      job: {
        title: "Senior React Developer",
        description: "Desc",
        type: "FULL_TIME",
        remote: "ONSITE",
        location: "Boston, MA",
        salaryMin: 70_000,
        salaryMax: 80_000,
        currency: "USD",
      },
      company: {
        name: "NewTek Solutions",
        description: "About",
        contactEmail: "contact@teksolutions.com",
        contactPhone: null,
      },
    });
  });
});
