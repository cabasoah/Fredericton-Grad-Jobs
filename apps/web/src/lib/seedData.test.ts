import { describe, expect, it } from "vitest";
import { JobListSchema } from "@fredericton-grad-jobs/shared";
import seed from "../../db/jobs.json";

// The app validates API responses with the shared schemas, so the json-server
// data file must always satisfy them.
describe("db/jobs.json", () => {
  it("matches the shared Job schema", () => {
    const result = JobListSchema.safeParse(seed.jobs);
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.data?.length).toBeGreaterThan(0);
  });
});
