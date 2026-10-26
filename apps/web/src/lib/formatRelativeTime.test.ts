import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const now = new Date("2026-10-26T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

describe("formatRelativeTime", () => {
  it.each([
    [10, "just now"],
    [5 * 60, "5 minutes ago"],
    [3 * 60 * 60, "3 hours ago"],
    [24 * 60 * 60, "yesterday"],
    [3 * 24 * 60 * 60, "3 days ago"],
    [14 * 24 * 60 * 60, "2 weeks ago"],
    [65 * 24 * 60 * 60, "2 months ago"],
    [400 * 24 * 60 * 60, "last year"],
  ])("%i seconds ago is %j", (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now)).toBe(expected);
  });
});
