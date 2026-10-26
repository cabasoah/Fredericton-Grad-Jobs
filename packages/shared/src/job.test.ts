import { describe, expect, it } from "vitest";
import { JobInputSchema, JobSchema, type JobInput } from "./job";

const validInput: JobInput = {
  title: "Senior React Developer",
  type: "Full-Time",
  location: "Fredericton, NB",
  description: "Build things.",
  salary: "$70K - $80K",
  company: {
    name: "Example Co",
    description: "We make things.",
    contactEmail: "jobs@example.com",
    contactPhone: "",
  },
};

describe("JobInputSchema", () => {
  it("accepts a valid job", () => {
    expect(JobInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts a salary outside the standard ranges", () => {
    expect(JobInputSchema.safeParse({ ...validInput, salary: "$100K - $110K" }).success).toBe(true);
  });

  it("rejects an unknown job type", () => {
    expect(JobInputSchema.safeParse({ ...validInput, type: "Contract" }).success).toBe(false);
  });

  it("rejects an invalid contact email", () => {
    const company = { ...validInput.company, contactEmail: "not-an-email" };
    expect(JobInputSchema.safeParse({ ...validInput, company }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(JobInputSchema.safeParse({ ...validInput, title: "" }).success).toBe(false);
  });
});

describe("JobSchema", () => {
  it("requires a string id", () => {
    expect(JobSchema.safeParse(validInput).success).toBe(false);
    expect(JobSchema.safeParse({ ...validInput, id: "8d2f" }).success).toBe(true);
    expect(JobSchema.safeParse({ ...validInput, id: 1 }).success).toBe(false);
  });
});
