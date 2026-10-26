import { describe, expect, it } from "vitest";
import { filtersFromSearchParams, filtersToSearchParams, hasActiveFilters } from "./jobFilters";

const parse = (query: string) => filtersFromSearchParams(new URLSearchParams(query));

describe("filtersFromSearchParams", () => {
  it("reads every filter", () => {
    expect(
      parse("q=react&type=INTERNSHIP&remote=REMOTE&location=Moncton&salaryMin=60000&tags=react,%20ts&sort=salary_desc"),
    ).toEqual({
      q: "react",
      type: "INTERNSHIP",
      remote: "REMOTE",
      location: "Moncton",
      salaryMin: 60000,
      tags: ["react", "ts"],
      sort: "salary_desc",
    });
  });

  it("ignores invalid, empty and default values", () => {
    expect(parse("q=%20%20&type=FOO&remote=&salaryMin=abc&tags=,,&sort=newest")).toEqual({});
    expect(parse("salaryMin=-5")).toEqual({});
    expect(parse("salaryMin=1e9")).toEqual({});
  });
});

describe("filtersToSearchParams", () => {
  it("round-trips through the URL and drops defaults", () => {
    const filters = { q: "dev", type: "FULL_TIME" as const, salaryMin: 50000, tags: ["a", "b"], sort: "newest" as const };
    const params = filtersToSearchParams(filters);
    expect(params.toString()).toBe("q=dev&type=FULL_TIME&salaryMin=50000&tags=a%2Cb");
    expect(filtersFromSearchParams(params)).toEqual({ q: "dev", type: "FULL_TIME", salaryMin: 50000, tags: ["a", "b"] });
  });
});

describe("hasActiveFilters", () => {
  it("does not count the sort order as a filter", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ sort: "salary_asc" })).toBe(false);
    expect(hasActiveFilters({ location: "Moncton" })).toBe(true);
  });
});
