import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { JobCreateSchema, JobListQuerySchema, JobUpdateSchema } from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { HttpError, notFound } from "../errors";
import { currentUser, requireAuth, requireRole, type AuthUser } from "../auth/middleware";
import type { SessionConfig } from "../auth/session";
import { encodeCursor, orderByFor, whereFor } from "./jobQuery";

const include = { company: true } as const;

const IdParamsSchema = z.object({ id: z.string().min(1) });

type Tx = Prisma.TransactionClient;

// Loads a job the current user may change: 404 if missing, 403 if it was
// imported (source != MANUAL, nobody may edit it) or posted by someone else.
const findOwnedJob = async (tx: Tx, id: string, user: AuthUser) => {
  const job = await tx.job.findUnique({
    where: { id },
    select: { id: true, source: true, postedById: true, salaryMin: true, salaryMax: true },
  });
  if (!job) throw notFound("Job not found");
  if (job.source !== "MANUAL") {
    throw new HttpError(403, "FORBIDDEN", "Imported jobs cannot be edited or deleted");
  }
  if (job.postedById !== user.id) {
    throw new HttpError(403, "FORBIDDEN", "Only the employer who posted this job can change it");
  }
  return job;
};

export const jobsRouter = (db: Db, session: SessionConfig, writeLimiter: RequestHandler) => {
  const router = Router();
  const signedIn = requireAuth(db, session);

  router.get("/", async (req, res) => {
    const query = JobListQuerySchema.parse(req.query);
    const rows = await db.job.findMany({
      where: whereFor(query),
      orderBy: orderByFor(query.sort),
      take: query.limit + 1,
      include,
    });
    const data = rows.slice(0, query.limit);
    const last = data.at(-1);
    const nextCursor = rows.length > query.limit && last ? encodeCursor(query.sort, last) : null;
    res.json({ data, nextCursor });
  });

  router.get("/:id", async (req, res) => {
    const { id } = IdParamsSchema.parse(req.params);
    const job = await db.job.findUnique({ where: { id }, include });
    if (!job) throw notFound("Job not found");
    res.json(job);
  });

  // Employers post for their own company; the job records who posted it.
  router.post("/", writeLimiter, signedIn, requireRole("EMPLOYER"), async (req, res) => {
    const user = currentUser(req);
    const body = JobCreateSchema.parse(req.body);
    if (!user.companyId) {
      throw new HttpError(403, "FORBIDDEN", "Your employer account is not linked to a company");
    }
    const job = await db.job.create({
      data: { ...body, source: "MANUAL", companyId: user.companyId, postedById: user.id },
      include,
    });
    res.status(201).json(job);
  });

  router.patch("/:id", writeLimiter, signedIn, async (req, res) => {
    const user = currentUser(req);
    const { id } = IdParamsSchema.parse(req.params);
    const body = JobUpdateSchema.parse(req.body);
    const job = await db.$transaction(async (tx) => {
      const existing = await findOwnedJob(tx, id, user);

      // The schema only checks the range when both ends are sent.
      const salaryMin = body.salaryMin !== undefined ? body.salaryMin : existing.salaryMin;
      const salaryMax = body.salaryMax !== undefined ? body.salaryMax : existing.salaryMax;
      if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        throw new HttpError(400, "VALIDATION_ERROR", "Request validation failed", [
          { path: "salaryMax", message: "salaryMax must be greater than or equal to salaryMin" },
        ]);
      }
      return tx.job.update({ where: { id }, data: body, include });
    });
    res.json(job);
  });

  router.delete("/:id", writeLimiter, signedIn, async (req, res) => {
    const user = currentUser(req);
    const { id } = IdParamsSchema.parse(req.params);
    await db.$transaction(async (tx) => {
      await findOwnedJob(tx, id, user);
      await tx.job.delete({ where: { id } });
    });
    res.status(204).end();
  });

  return router;
};
