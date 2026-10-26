import { z } from "zod";

// Options offered by the job form. Existing data only uses Full-Time and Part-Time.
export const JOB_TYPES = ["Full-Time", "Part-Time", "Remote", "Internship"] as const;

// Salary ranges offered by the job form. Stored salaries are free text and may
// fall outside this list (e.g. "$100K - $110K" in the seed data).
export const SALARY_OPTIONS = [
  "Under $50K",
  "$50K - $60K",
  "$60K - $70K",
  "$70K - $80K",
  "$80K - $90K",
  "$90K - $100K",
  "$100K - $125K",
  "$125K - $150K",
  "$150K - $175K",
  "$175K - $200K",
  "Over $200K",
] as const;

export const CompanySchema = z.object({
  name: z.string(),
  description: z.string(),
  contactEmail: z.email(),
  contactPhone: z.string(),
});

// A job as submitted by the form, before the server assigns an id.
export const JobInputSchema = z.object({
  title: z.string().min(1),
  type: z.enum(JOB_TYPES),
  location: z.string().min(1),
  description: z.string(),
  salary: z.string().min(1),
  company: CompanySchema,
});

export const JobSchema = JobInputSchema.extend({
  id: z.string(),
});

export const JobListSchema = z.array(JobSchema);

export type JobType = (typeof JOB_TYPES)[number];
export type Company = z.infer<typeof CompanySchema>;
export type JobInput = z.infer<typeof JobInputSchema>;
export type Job = z.infer<typeof JobSchema>;
