import { z } from "zod";

// Values mirror the Prisma enums in apps/api/prisma/schema.prisma.
export const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
export const REMOTE_TYPES = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const JOB_SOURCES = ["MANUAL", "GREENHOUSE", "LEVER"] as const;
export const JOB_STATUSES = ["OPEN", "CLOSED"] as const;
export const JOB_SORTS = ["newest", "salary_desc", "salary_asc"] as const;

export const JobTypeSchema = z.enum(JOB_TYPES);
export const RemoteTypeSchema = z.enum(REMOTE_TYPES);
export const JobSourceSchema = z.enum(JOB_SOURCES);
export const JobStatusSchema = z.enum(JOB_STATUSES);
export const JobSortSchema = z.enum(JOB_SORTS);

export type JobType = z.infer<typeof JobTypeSchema>;
export type RemoteType = z.infer<typeof RemoteTypeSchema>;
export type JobSource = z.infer<typeof JobSourceSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobSort = z.infer<typeof JobSortSchema>;

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

// Currencies offered by the job form. The API accepts any 3-letter ISO code.
export const CURRENCIES = ["CAD", "USD"] as const;
export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/, "Must be a 3-letter currency code");
