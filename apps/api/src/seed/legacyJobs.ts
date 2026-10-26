import { z } from "zod";
import type { JobType, RemoteType } from "@fredericton-grad-jobs/shared";

// Shape of prisma/seed-data/jobs.json, the data file of the json-server
// prototype.
const LegacyJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  description: z.string(),
  location: z.string(),
  salary: z.string(),
  company: z.object({
    name: z.string(),
    description: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string(),
  }),
});

export const LegacyJobsFileSchema = z.object({ jobs: z.array(LegacyJobSchema) });

export type LegacyJob = z.infer<typeof LegacyJobSchema>;

export type SalaryRange = { salaryMin: number | null; salaryMax: number | null };

// "$70K" -> 70000. Accepts an optional "$" so "$50K - 60K" (an old form
// option) also parses.
const parseAmount = (text: string): number | null => {
  const match = /^\$?\s*(\d+(?:\.\d+)?)\s*([KkMm]?)$/.exec(text.trim());
  if (!match?.[1]) return null;
  const multiplier = { "": 1, k: 1_000, m: 1_000_000 }[(match[2] ?? "").toLowerCase()] ?? 1;
  return Math.round(Number(match[1]) * multiplier);
};

// Converts salary strings from the old form into integers:
// "$70K - $80K" -> 70000..80000, "Under $50K" -> ..50000, "Over $200K" -> 200000..
export const parseSalaryRange = (salary: string): SalaryRange => {
  const text = salary.trim();
  const under = /^under\s+(.+)$/i.exec(text);
  if (under?.[1]) {
    const max = parseAmount(under[1]);
    if (max !== null) return { salaryMin: null, salaryMax: max };
  }
  const over = /^over\s+(.+)$/i.exec(text);
  if (over?.[1]) {
    const min = parseAmount(over[1]);
    if (min !== null) return { salaryMin: min, salaryMax: null };
  }
  const [low, high, ...rest] = text.split(/\s*[-–]\s*/);
  if (low !== undefined && high !== undefined && rest.length === 0) {
    const min = parseAmount(low);
    const max = parseAmount(high);
    if (min !== null && max !== null && min <= max) return { salaryMin: min, salaryMax: max };
  }
  throw new Error(`Unrecognised salary: "${salary}"`);
};

// The old "Remote" job type becomes a full-time remote job.
export const convertJobType = (type: string): { type: JobType; remote: RemoteType } => {
  switch (type) {
    case "Full-Time":
      return { type: "FULL_TIME", remote: "ONSITE" };
    case "Part-Time":
      return { type: "PART_TIME", remote: "ONSITE" };
    case "Internship":
      return { type: "INTERNSHIP", remote: "ONSITE" };
    case "Remote":
      return { type: "FULL_TIME", remote: "REMOTE" };
    default:
      throw new Error(`Unrecognised job type: "${type}"`);
  }
};

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

export const convertLegacyJob = (job: LegacyJob) => ({
  job: {
    title: job.title.trim(),
    description: job.description.trim(),
    ...convertJobType(job.type),
    location: job.location.trim(),
    ...parseSalaryRange(job.salary),
    // The seed jobs are in US cities and priced in dollars.
    currency: "USD",
  },
  company: {
    name: job.company.name.trim(),
    description: blankToNull(job.company.description),
    contactEmail: blankToNull(job.company.contactEmail),
    contactPhone: blankToNull(job.company.contactPhone),
  },
});
