import { describe, expect, it } from "vitest";
import { adjacentColumn } from "./kanbanKeyboard";

// Three 200 px columns with 20 px gaps, given out of order.
const columns = [
  { id: "c", left: 440, top: 100, width: 200 },
  { id: "a", left: 0, top: 100, width: 200 },
  { id: "b", left: 220, top: 100, width: 200 },
];

describe("adjacentColumn", () => {
  it("finds the next column to the right or left of the dragged card", () => {
    expect(adjacentColumn(columns, 100, "right")?.id).toBe("b");
    expect(adjacentColumn(columns, 320, "right")?.id).toBe("c");
    expect(adjacentColumn(columns, 320, "left")?.id).toBe("a");
  });

  it("returns undefined at either end", () => {
    expect(adjacentColumn(columns, 540, "right")).toBeUndefined();
    expect(adjacentColumn(columns, 100, "left")).toBeUndefined();
  });
});
