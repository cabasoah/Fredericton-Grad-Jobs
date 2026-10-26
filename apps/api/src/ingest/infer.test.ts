import { describe, expect, it } from "vitest";
import { inferJobType, inferRemote, typeFromLabel } from "./infer";

describe("inferRemote", () => {
  // Location strings seen in the real Greenhouse responses.
  it.each([
    ["Remote - USA", "REMOTE"],
    ["Remote, Canada; Remote, United States", "REMOTE"],
    ["Hybrid - New York, NY", "HYBRID"],
    ["Kitchener-Waterloo, ON; Toronto, ON", "ONSITE"],
    ["San Francisco, CA • New York, NY • United States", "ONSITE"],
  ])("%j -> %s", (location, expected) => {
    expect(inferRemote(location)).toBe(expected);
  });
});

describe("typeFromLabel", () => {
  // Labels seen in the real responses (Lever commitment, Greenhouse Employment Type).
  it.each([
    ["Full-time", "FULL_TIME"],
    ["Full Time", "FULL_TIME"],
    ["Permanent", "FULL_TIME"],
    ["Regular", "FULL_TIME"],
    ["Internship", "INTERNSHIP"],
    ["Intern", "INTERNSHIP"],
    ["Scholarship", "INTERNSHIP"],
    ["Short Term", "CONTRACT"],
    ["Fixed-Term", "CONTRACT"],
    ["Temporary", "CONTRACT"],
    ["Part-time", "PART_TIME"],
  ])("%j -> %s", (label, expected) => {
    expect(typeFromLabel(label)).toBe(expected);
  });

  it("returns undefined for missing or unknown labels", () => {
    expect(typeFromLabel(undefined)).toBeUndefined();
    expect(typeFromLabel("Other")).toBeUndefined();
  });
});

describe("inferJobType", () => {
  it("uses the label, then internship words in the title, then FULL_TIME", () => {
    expect(inferJobType("Short Term", "Software Engineer")).toBe("CONTRACT");
    expect(inferJobType(undefined, "Software Engineering Intern")).toBe("INTERNSHIP");
    expect(inferJobType(undefined, "Contract Manager")).toBe("FULL_TIME");
  });
});
