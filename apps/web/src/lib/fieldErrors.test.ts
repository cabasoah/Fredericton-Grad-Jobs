import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/auth/AuthContext";
import { ApiError } from "./api";
import { apiFieldErrors, isFieldOf } from "./fieldErrors";

describe("apiFieldErrors", () => {
  it("extracts path and message pairs from ApiError details", () => {
    const err = new ApiError(409, "Conflict", [
      { path: "email", message: "Taken" },
      { unrelated: true },
    ]);
    expect(apiFieldErrors(err)).toEqual([{ path: "email", message: "Taken" }]);
  });

  it("returns nothing for other errors", () => {
    expect(apiFieldErrors(new Error("boom"))).toEqual([]);
    expect(apiFieldErrors(new ApiError(500, "Server error"))).toEqual([]);
  });

  it("narrows paths to known field names", () => {
    expect(isFieldOf(["email", "password"] as const, "email")).toBe(true);
    expect(isFieldOf(["email", "password"] as const, "role")).toBe(false);
  });
});

describe("safeReturnTo", () => {
  it.each([
    ["/add-job", "/add-job"],
    ["/edit-job/abc?x=1", "/edit-job/abc?x=1"],
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["add-job", "/"],
  ])("maps %j to %j", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
