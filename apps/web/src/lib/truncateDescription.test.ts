import { describe, expect, it } from "vitest";
import { DESCRIPTION_PREVIEW_LENGTH, truncateDescription } from "./truncateDescription";

describe("truncateDescription", () => {
  it("leaves a short description unchanged", () => {
    expect(truncateDescription("Short description.")).toEqual({
      text: "Short description.",
      truncated: false,
    });
  });

  it("leaves a description of exactly the preview length unchanged", () => {
    const text = "a".repeat(DESCRIPTION_PREVIEW_LENGTH);
    expect(truncateDescription(text)).toEqual({ text, truncated: false });
  });

  it("cuts a longer description to the preview length and appends ...", () => {
    const text = "a".repeat(DESCRIPTION_PREVIEW_LENGTH + 1);
    expect(truncateDescription(text)).toEqual({
      text: "a".repeat(DESCRIPTION_PREVIEW_LENGTH) + "...",
      truncated: true,
    });
  });
});
