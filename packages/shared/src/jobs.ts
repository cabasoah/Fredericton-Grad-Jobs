import { z } from "zod";
import { CompanySchema } from "./companies";
import {
  CurrencySchema,
  JobSortSchema,
  JobSourceSchema,
  JobStatusSchema,
  JobTypeSchema,
  RemoteTypeSchema,
} from "./enums";

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;

// Annual salary in whole currency units.
const SalarySchema = z.number().int().min(0).max(10_000_000);

// Fields an employer may write, with no defaults. Defaults live only on the
// create schema so that a PATCH never resets fields the client did not send.
// The company, poster, source and externalId are set by the API, never by
// the client: an employer always posts for their own company, and only
// importers create non-MANUAL jobs.
const JobFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20_000),
  type: JobTypeSchema,
  remote: RemoteTypeSchema,
  location: z.string().trim().min(1).max(200),
  salaryMin: SalarySchema.nullable(),
  salaryMax: SalarySchema.nullable(),
  currency: CurrencySchema,
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
  externalUrl: z.url().nullable(),
  status: JobStatusSchema,
});

type SalaryRange = { salaryMin?: number | null; salaryMax?: number | null };

const checkSalaryRange = (value: SalaryRange, ctx: z.RefinementCtx) => {
  if (value.salaryMin != null && value.salaryMax != null && value.salaryMin > value.salaryMax) {
    ctx.addIssue({
      code: "custom",
      path: ["salaryMax"],
      message: "salaryMax must be greater than or equal to salaryMin",
    });
  }
};

// POST /jobs body (employers only). The job is posted for the employer's
// own company.
export const JobCreateSchema = JobFieldsSchema.extend({
  remote: RemoteTypeSchema.default("ONSITE"),
  salaryMin: SalarySchema.nullable().default(null),
  salaryMax: SalarySchema.nullable().default(null),
  currency: CurrencySchema.default("CAD"),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  externalUrl: z.url().nullable().default(null),
  status: JobStatusSchema.default("OPEN"),
})
  .strict()
  .superRefine(checkSalaryRange);

// PATCH /jobs/:id body (the job's poster only). Every field is optional;
// only sent fields change.
export const JobUpdateSchema = JobFieldsSchema.partial()
  .strict()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({ code: "custom", message: "Provide at least one field to update" });
    }
    checkSalaryRange(value, ctx);
  });

// Accepts "a,b" as well as repeated ?tags=a&tags=b.
const commaSeparated = (value: unknown) => (typeof value === "string" ? value.split(",") : value);

// GET /jobs query string.
export const JobListQuerySchema = z.strictObject({
  q: z.string().trim().min(1).max(200).optional(),
  type: JobTypeSchema.optional(),
  remote: RemoteTypeSchema.optional(),
  location: z.string().trim().min(1).max(200).optional(),
  // Jobs paying at least this much (compares against salaryMax, or salaryMin
  // when there is no maximum). Jobs without a salary are excluded.
  salaryMin: z.coerce.number().int().min(0).optional(),
  // Jobs that have every listed tag.
  tags: z.preprocess(commaSeparated, z.array(z.string().trim().min(1)).max(20)).optional(),
  status: JobStatusSchema.default("OPEN"),
  sort: JobSortSchema.default("newest"),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

// Response shape: checks types only, not the input limits above. Imported
// jobs are written by the ingester, not the form, and may be longer.
const JobBaseSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: JobTypeSchema,
  remote: RemoteTypeSchema,
  location: z.string(),
  salaryMin: z.number().int().nullable(),
  salaryMax: z.number().int().nullable(),
  currency: z.string(),
  tags: z.array(z.string()),
  externalUrl: z.string().nullable(),
  status: JobStatusSchema,
  id: z.string(),
  source: JobSourceSchema,
  externalId: z.string().nullable(),
  postedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  companyId: z.string(),
  postedById: z.string().nullable(),
});

// Job as returned by the API, with its company embedded.
export const JobSchema = JobBaseSchema.extend({ company: CompanySchema });

export const JobListResponseSchema = z.object({
  data: z.array(JobSchema),
  nextCursor: z.string().nullable(),
});

export const CompanyListItemSchema = CompanySchema.extend({
  openJobCount: z.number().int(),
});

export const CompanyListResponseSchema = z.object({
  data: z.array(CompanyListItemSchema),
});

// GET /companies/:id: the company with its open jobs (company not repeated).
export const CompanyWithJobsSchema = CompanySchema.extend({
  jobs: z.array(JobBaseSchema),
});

export type Job = z.infer<typeof JobSchema>;
export type JobCreate = z.infer<typeof JobCreateSchema>;
// What a client sends: fields with defaults may be omitted.
export type JobCreateInput = z.input<typeof JobCreateSchema>;
export type JobUpdate = z.infer<typeof JobUpdateSchema>;
export type JobListQuery = z.infer<typeof JobListQuerySchema>;
export type JobListResponse = z.infer<typeof JobListResponseSchema>;
export type CompanyListItem = z.infer<typeof CompanyListItemSchema>;
export type CompanyWithJobs = z.infer<typeof CompanyWithJobsSchema>;
