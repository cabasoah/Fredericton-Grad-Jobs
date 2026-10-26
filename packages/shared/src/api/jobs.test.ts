import { describe, expect, it } from "vitest";
import { JobCreateSchema, JobListQuerySchema, JobUpdateSchema } from "./jobs";

const validCreate = {
  title: "Junior Developer",
  description: "Build things.",
  type: "FULL_TIME",
  location: "Fredericton, NB",
  company: { name: "Example Co" },
};

describe("JobCreateSchema", () => {
  it("applies defaults for omitted fields", () => {
    const parsed = JobCreateSchema.parse(validCreate);
    expect(parsed).toMatchObject({
      remote: "ONSITE",
      salaryMin: null,
      salaryMax: null,
      currency: "CAD",
      tags: [],
      source: "MANUAL",
      externalId: null,
      externalUrl: null,
      status: "OPEN",
    });
  });

  it("requires exactly one of companyId or company", () => {
    const { company: _company, ...withoutCompany } = validCreate;
    expect(JobCreateSchema.safeParse(withoutCompany).success).toBe(false);
    expect(JobCreateSchema.safeParse({ ...validCreate, companyId: "c1" }).success).toBe(false);
    expect(JobCreateSchema.safeParse({ ...withoutCompany, companyId: "c1" }).success).toBe(true);
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
