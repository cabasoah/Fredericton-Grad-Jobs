import { Router } from "express";
import { z } from "zod";
import {
  ApplicationCreateSchema,
  ApplicationUpdateSchema,
  REACHED_APPLIED_STAGES,
  type ApplicationStage,
} from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";
import { HttpError, notFound } from "../errors";
import { currentUser, requireAuth, requireRole } from "../auth/middleware";
import type { SessionConfig } from "../auth/session";
import { computeApplicationStats } from "../applications/stats";
import { TRACKER_TIME_ZONE } from "../applications/weeks";

const IdParamsSchema = z.object({ id: z.string().min(1) });

// "2026-10-27" is stored as 12:00 UTC so it is the same calendar day in
// Atlantic time; full date-times are stored as given.
const toDate = (value: string | null | undefined) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value);
};

const reachesApplied = (stage: ApplicationStage) => REACHED_APPLIED_STAGES.includes(stage);

// Another user's application is reported as missing (404), not forbidden
// (403), so ids cannot be probed for existence.
const applicationNotFound = () => notFound("Application not found");

export const applicationsRouter = (db: Db, session: SessionConfig) => {
  const router = Router();
  router.use(requireAuth(db, session), requireRole("SEEKER"));

  // Every query below is filtered by the current user's id.
  router.get("/", async (req, res) => {
    const user = currentUser(req);
    const data = await db.application.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    });
    res.json({ data });
  });

  router.get("/stats", async (req, res) => {
    const user = currentUser(req);
    const applications = await db.application.findMany({
      where: { userId: user.id },
      select: { stage: true, appliedAt: true, events: { select: { toStage: true } } },
    });
    res.json(computeApplicationStats(applications, new Date(), TRACKER_TIME_ZONE));
  });

  router.get("/:id", async (req, res) => {
    const user = currentUser(req);
    const { id } = IdParamsSchema.parse(req.params);
    const application = await db.application.findFirst({
      where: { id, userId: user.id },
      include: { events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
    });
    if (!application) throw applicationNotFound();
    res.json(application);
  });

  router.post("/", async (req, res) => {
    const user = currentUser(req);
    const body = ApplicationCreateSchema.parse(req.body);

    const application = await db.$transaction(async (tx) => {
      if ("jobId" in body) {
        // Saving a job from this board: copy its details so the card
        // survives the job closing or being deleted.
        const job = await tx.job.findUnique({
          where: { id: body.jobId },
          select: { id: true, title: true, externalUrl: true, company: { select: { name: true } } },
        });
        if (!job) throw notFound("Job not found");
        const existing = await tx.application.findUnique({
          where: { userId_jobId: { userId: user.id, jobId: job.id } },
          select: { id: true },
        });
        if (existing) {
          throw new HttpError(409, "CONFLICT", "This job is already in your tracker", { applicationId: existing.id });
        }
        return tx.application.create({
          data: {
            userId: user.id,
            jobId: job.id,
            companyName: job.company.name,
            roleTitle: job.title,
            url: job.externalUrl,
            stage: "SAVED",
            events: { create: { fromStage: null, toStage: "SAVED" } },
          },
        });
      }

      // An application found elsewhere.
      const appliedAt = toDate(body.appliedAt) ?? (reachesApplied(body.stage) ? new Date() : null);
      return tx.application.create({
        data: {
          userId: user.id,
          jobId: null,
          companyName: body.companyName,
          roleTitle: body.roleTitle,
          url: body.url,
          stage: body.stage,
          appliedAt,
          nextFollowUpAt: toDate(body.nextFollowUpAt) ?? null,
          notes: body.notes,
          events: { create: { fromStage: null, toStage: body.stage } },
        },
      });
    });
    res.status(201).json(application);
  });

  router.patch("/:id", async (req, res) => {
    const user = currentUser(req);
    const { id } = IdParamsSchema.parse(req.params);
    const body = ApplicationUpdateSchema.parse(req.body);

    const application = await db.$transaction(async (tx) => {
      const current = await tx.application.findFirst({
        where: { id, userId: user.id },
        select: { stage: true, appliedAt: true },
      });
      if (!current) throw applicationNotFound();

      const stageChanged = body.stage !== undefined && body.stage !== current.stage;
      const appliedAt = toDate(body.appliedAt);
      return tx.application.update({
        where: { id },
        data: {
          ...body,
          appliedAt:
            appliedAt !== undefined
              ? appliedAt
              : stageChanged && body.stage && reachesApplied(body.stage) && !current.appliedAt
                ? new Date()
                : undefined,
          nextFollowUpAt: toDate(body.nextFollowUpAt),
          // Every stage change is recorded; earlier events are never changed.
          ...(stageChanged && body.stage
            ? { events: { create: { fromStage: current.stage, toStage: body.stage } } }
            : {}),
        },
        include: { events: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
      });
    });
    res.json(application);
  });

  router.delete("/:id", async (req, res) => {
    const user = currentUser(req);
    const { id } = IdParamsSchema.parse(req.params);
    const { count } = await db.application.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) throw applicationNotFound();
    res.status(204).end();
  });

  return router;
};
