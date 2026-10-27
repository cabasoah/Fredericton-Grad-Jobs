import { z } from "zod";

// Values mirror the Prisma ApplicationStage enum, in board order.
export const APPLICATION_STAGES = ["SAVED", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as const;
export const ApplicationStageSchema = z.enum(APPLICATION_STAGES);
export type ApplicationStage = z.infer<typeof ApplicationStageSchema>;

export const APPLICATION_STAGE_LABELS: Record<ApplicationStage, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  OA: "Online assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Response-rate rules (agreed definitions):
// - "reached APPLIED": the stage history includes any of these.
export const REACHED_APPLIED_STAGES: readonly ApplicationStage[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];
// - "moved past APPLIED" (a response from the company): any of these.
export const RESPONSE_STAGES: readonly ApplicationStage[] = ["OA", "INTERVIEW", "OFFER", "REJECTED"];
// Funnel order on the dashboard.
export const FUNNEL_STAGES = ["SAVED", "APPLIED", "OA", "INTERVIEW", "OFFER"] as const;

// "2026-10-27" (a calendar date, stored as 12:00 UTC so it is the same day
// in Atlantic time) or a full ISO date-time.
const DateInputSchema = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);

const optionalText = (max: number) => z.string().trim().max(max);

// Fields a user may edit on any application.
const ApplicationFieldsSchema = z.object({
  companyName: z.string().trim().min(1, "Enter the company").max(200),
  roleTitle: z.string().trim().min(1, "Enter the role").max(200),
  url: z.url("Enter a full URL, e.g. https://...").nullable(),
  stage: ApplicationStageSchema,
  appliedAt: DateInputSchema.nullable(),
  nextFollowUpAt: DateInputSchema.nullable(),
  notes: optionalText(10_000),
});

// POST /applications: save a job from this board (details are copied from
// the job) or add one found elsewhere.
export const SaveJobApplicationSchema = z.strictObject({ jobId: z.string().min(1) });

export const ExternalApplicationSchema = ApplicationFieldsSchema.extend({
  url: z.url("Enter a full URL, e.g. https://...").nullable().default(null),
  stage: ApplicationStageSchema.default("APPLIED"),
  appliedAt: DateInputSchema.nullable().default(null),
  nextFollowUpAt: DateInputSchema.nullable().default(null),
  notes: optionalText(10_000).default(""),
}).strict();

export const ApplicationCreateSchema = z.union([SaveJobApplicationSchema, ExternalApplicationSchema]);

// PATCH /applications/:id: only sent fields change; a stage change is
// logged as an ApplicationEvent.
export const ApplicationUpdateSchema = ApplicationFieldsSchema.partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" });

export const ApplicationSchema = z.object({
  id: z.string(),
  jobId: z.string().nullable(),
  companyName: z.string(),
  roleTitle: z.string(),
  url: z.string().nullable(),
  stage: ApplicationStageSchema,
  appliedAt: z.iso.datetime().nullable(),
  nextFollowUpAt: z.iso.datetime().nullable(),
  notes: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ApplicationEventSchema = z.object({
  id: z.string(),
  fromStage: ApplicationStageSchema.nullable(),
  toStage: ApplicationStageSchema,
  createdAt: z.iso.datetime(),
});

export const ApplicationWithEventsSchema = ApplicationSchema.extend({
  events: z.array(ApplicationEventSchema),
});

export const ApplicationListResponseSchema = z.object({ data: z.array(ApplicationSchema) });

export const ApplicationStatsSchema = z.object({
  // Applications currently in each stage.
  countsByStage: z.record(ApplicationStageSchema, z.number().int()),
  // How many applications ever reached each funnel stage (or a later one).
  funnel: z.array(z.object({ stage: z.enum(FUNNEL_STAGES), count: z.number().int() })),
  // The last 12 ISO weeks (Monday-Sunday, America/Moncton), oldest first,
  // counted by appliedAt.
  weekly: z.array(z.object({ week: z.string(), weekStart: z.iso.date(), count: z.number().int() })),
  reachedApplied: z.number().int(),
  responded: z.number().int(),
  // responded / reachedApplied, or null when nothing has reached APPLIED.
  responseRate: z.number().nullable(),
  timeZone: z.string(),
});

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationEvent = z.infer<typeof ApplicationEventSchema>;
export type ApplicationWithEvents = z.infer<typeof ApplicationWithEventsSchema>;
export type ApplicationCreateInput = z.input<typeof ApplicationCreateSchema>;
export type ExternalApplicationInput = z.input<typeof ExternalApplicationSchema>;
export type ApplicationUpdate = z.input<typeof ApplicationUpdateSchema>;
export type ApplicationStats = z.infer<typeof ApplicationStatsSchema>;
