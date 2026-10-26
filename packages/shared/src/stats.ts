import { z } from "zod";
import { JobSourceSchema } from "./enums";

// GET /stats
export const StatsSchema = z.object({
  openJobs: z.number().int(),
  // Open jobs per source, including sources with none.
  openJobsBySource: z.record(JobSourceSchema, z.number().int()),
  // finishedAt of the most recent ingestion run (one company) with no errors.
  lastSuccessfulIngestAt: z.iso.datetime().nullable(),
});

export type Stats = z.infer<typeof StatsSchema>;
