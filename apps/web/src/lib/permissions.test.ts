import { describe, expect, it } from "vitest";
import type { User } from "@fredericton-grad-jobs/shared";
import { canManageJob } from "./permissions";

const owner: User = {
  id: "u1",
  email: "erin@acme.test",
  name: "Erin",
  role: "EMPLOYER",
  company: { id: "c1", name: "Acme" },
};

describe("canManageJob", () => {
  it("allows only the poster of a manual job", () => {
    expect(canManageJob(owner, { source: "MANUAL", postedById: "u1" })).toBe(true);
    expect(canManageJob({ ...owner, id: "u2" }, { source: "MANUAL", postedById: "u1" })).toBe(false);
    expect(canManageJob(null, { source: "MANUAL", postedById: "u1" })).toBe(false);
  });

  it("never allows changes to imported jobs", () => {
    expect(canManageJob(owner, { source: "GREENHOUSE", postedById: "u1" })).toBe(false);
  });

  it("does not treat an unowned job as owned by a signed-out visitor", () => {
    expect(canManageJob(null, { source: "MANUAL", postedById: null })).toBe(false);
  });
});
