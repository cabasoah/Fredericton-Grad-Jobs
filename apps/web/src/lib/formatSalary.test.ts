import { describe, expect, it } from "vitest";
import { formatSalary, formatSalaryRange } from "./formatSalary";

describe("formatSalary", () => {
  it.each([
    [70_000, 80_000, "USD", "$70K - $80K / Year"],
    [65_500, 65_500, "USD", "$65.5K / Year"],
    [80_000, null, "USD", "From $80K / Year"],
    [null, 50_000, "USD", "Up to $50K / Year"],
    [null, null, "USD", "Salary not listed"],
    [70_000, 80_000, "CAD", "CA$70K - CA$80K / Year"],
  ])("formats %j-%j %s", (salaryMin, salaryMax, currency, expected) => {
    expect(formatSalary({ salaryMin, salaryMax, currency })).toBe(expected);
  });
});

describe("formatSalaryRange", () => {
  it.each([
    [70_000, 80_000, "USD", "$70,000 – $80,000 per year"],
    [60_000, 75_000, "CAD", "CA$60,000 – CA$75,000 per year"],
    [65_500, 65_500, "USD", "$65,500 per year"],
    [80_000, null, "USD", "From $80,000 per year"],
    [null, 50_000, "USD", "Up to $50,000 per year"],
    [null, null, "USD", "Salary not listed"],
  ])("formats %j-%j %s", (salaryMin, salaryMax, currency, expected) => {
    expect(formatSalaryRange({ salaryMin, salaryMax, currency })).toBe(expected);
  });
});
