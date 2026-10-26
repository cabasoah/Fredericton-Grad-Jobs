import { describe, expect, it } from "vitest";
import { JobCreateSchema, JobListQuerySchema, JobUpdateSchema } from "./jobs";

const validCreate = {
  title: "Junior Developer",
  description: "Build things.",
  type: "FULL_TIME",
  location: "Fredericton, NB",
};

describe("JobCreateSchema", () => {
  it("applies defaults for omitted fields", () => {
    const parsed = JobCreateSchema.parse(validCreate);
    expect(parsed).toEqual({
      ...validCreate,
      remote: "ONSITE",
      salaryMin: null,
      salaryMax: null,
      currency: "CAD",
      tags: [],
      externalUrl: null,
      status: "OPEN",
    });
  });

  it("does not let the client choose the company, poster or source", () => {
    for (const extra of [
      { companyId: "c1" },
      { company: { name: "Someone Else" } },
      { postedById: "u1" },
      { source: "GREENHOUSE" },
      { externalId: "gh-1" },
    ]) {
      expect(JobCreateSchema.safeParse({ ...validCreate, ...extra }).success).toBe(false);
    }
  });

  it("rejects salaryMin greater than salaryMax", () => {
    const result = JobCreateSchema.safeParse({ ...validCreate, salaryMin: 90000, salaryMax: 80000 });
    expect(result.error?.issues[0]?.path).toEqual(["salaryMax"]);
  });

  it("rejects unknown fields and invalid enums", () => {
    expect(JobCreateSchema.safeParse({ ...validCreate, salary: "$70K" }).success).toBe(false);
    expect(JobCreateSchema.safeParse({ ...validCreate, type: "Full-Time" }).success).toBe(false);
  });
});

describe("JobUpdateSchema", () => {
  it("does not fill in defaults for fields that were not sent", () => {
    expect(JobUpdateSchema.parse({ title: "New title" })).toEqual({ title: "New title" });
  });

  it("rejects an empty update", () => {
    expect(JobUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("JobListQuerySchema", () => {
  it("applies defaults", () => {
    expect(JobListQuerySchema.parse({})).toEqual({ status: "OPEN", sort: "newest", limit: 20 });
  });

  it("coerces numbers and splits comma-separated tags", () => {
    expect(JobListQuerySchema.parse({ salaryMin: "70000", limit: "5", tags: "react,remote" })).toMatchObject({
      salaryMin: 70000,
      limit: 5,
      tags: ["react", "remote"],
    });
    expect(JobListQuerySchema.parse({ tags: ["react", "node"] }).tags).toEqual(["react", "node"]);
  });

  it("caps limit at 50 and rejects unknown params", () => {
    expect(JobListQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
    expect(JobListQuerySchema.safeParse({ page: "2" }).success).toBe(false);
  });
});
