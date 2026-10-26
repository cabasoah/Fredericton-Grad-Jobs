import { Router, type RequestHandler } from "express";
import { z } from "zod";
import {
  JobCreateSchema,
  JobListQuerySchema,
  JobUpdateSchema,
  type JobCreate,
} from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { HttpError, notFound } from "../errors";
import { encodeCursor, orderByFor, whereFor } from "./jobQuery";

const include = { company: true } as const;

const IdParamsSchema = z.object({ id: z.string().min(1) });

type Tx = Prisma.TransactionClient;

const companyNotFound = () =>
  new HttpError(400, "VALIDATION_ERROR", "Company not found", [
    { path: "companyId", message: "No company with this id" },
  ]);

const assertCompanyExists = async (tx: Tx, companyId: string) => {
  const company = await tx.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) throw companyNotFound();
};

// Reuses a company with the same name (case-insensitive) or creates it.
const resolveCompanyId = async (tx: Tx, body: JobCreate): Promise<string> => {
  if (body.companyId !== undefined) {
    await assertCompanyExists(tx, body.companyId);
    return body.companyId;
  }
  if (body.company === undefined) {
    // Unreachable: JobCreateSchema requires one of them.
    throw companyNotFound();
  }
  const existing = await tx.company.findFirst({
    where: { name: { equals: body.company.name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await tx.company.create({ data: body.company, select: { id: true } });
  return created.id;
};

export const jobsRouter = (db: Db, writeLimiter: RequestHandler) => {
  const router = Router();

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

  router.post("/", writeLimiter, async (req, res) => {
    const body = JobCreateSchema.parse(req.body);
    const job = await db.$transaction(async (tx) => {
      const companyId = await resolveCompanyId(tx, body);
      const { company: _company, companyId: _companyId, ...fields } = body;
      return tx.job.create({ data: { ...fields, companyId }, include });
    });
    res.status(201).json(job);
  });

  router.patch("/:id", writeLimiter, async (req, res) => {
    const { id } = IdParamsSchema.parse(req.params);
    const body = JobUpdateSchema.parse(req.body);
    const job = await db.$transaction(async (tx) => {
      const existing = await tx.job.findUnique({
        where: { id },
        select: { salaryMin: true, salaryMax: true },
      });
      if (!existing) throw notFound("Job not found");
      if (body.companyId !== undefined) await assertCompanyExists(tx, body.companyId);

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

  router.delete("/:id", writeLimiter, async (req, res) => {
    // A missing job raises Prisma P2025, mapped to 404 by the error middleware.
    const { id } = IdParamsSchema.parse(req.params);
    await db.job.delete({ where: { id } });
    res.status(204).end();
  });

  return router;
};
