import { describe, expect, it } from "vitest";
import type { RemoteType } from "@fredericton-grad-jobs/shared";
import { isAtlanticCanada, isInRegion } from "./region";

const job = (location: string, remote: RemoteType = "ONSITE") => ({ location, remote });

describe("isAtlanticCanada", () => {
  it.each([
    "Fredericton, NB",
    "Moncton, New Brunswick",
    "Saint John, NB, Canada",
    "Halifax, NS",
    "Halifax, Nova Scotia",
    "Charlottetown",
    "St. John's, NL",
    "Remote - Atlantic Canada",
  ])("matches %s", (location) => {
    expect(isAtlanticCanada(location)).toBe(true);
  });

  it.each(["Toronto, ON", "Halifax, West Yorkshire", "Sydney, Australia", "Mexico City", "NBA Office, New York", "Vancouver, BC"])(
    "does not match %s",
    (location) => {
      expect(isAtlanticCanada(location)).toBe(false);
    },
  );
});

describe("isInRegion", () => {
  it("keeps remote roles open to Canada", () => {
    expect(isInRegion(job("Remote - Canada", "REMOTE"))).toBe(true);
    expect(isInRegion(job("Remote, Canada; Remote, United States", "REMOTE"))).toBe(true);
  });

  it("drops remote roles elsewhere and on-site roles in the rest of Canada", () => {
    expect(isInRegion(job("Remote - USA", "REMOTE"))).toBe(false);
    expect(isInRegion(job("Toronto, Canada", "ONSITE"))).toBe(false);
    expect(isInRegion(job("Toronto, Canada", "HYBRID"))).toBe(false);
  });

  it("keeps on-site and hybrid roles in Atlantic Canada", () => {
    expect(isInRegion(job("Fredericton, NB", "ONSITE"))).toBe(true);
    expect(isInRegion(job("Halifax, NS", "HYBRID"))).toBe(true);
  });
});
