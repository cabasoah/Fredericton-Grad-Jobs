import { Router } from "express";
import { z } from "zod";
import type { Db } from "../db";
import { notFound } from "../errors";

const IdParamsSchema = z.object({ id: z.string().min(1) });

export const companiesRouter = (db: Db) => {
  const router = Router();

  // All companies by name, each with its number of open jobs.
  router.get("/", async (_req, res) => {
    const companies = await db.company.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: { _count: { select: { jobs: { where: { status: "OPEN" } } } } },
    });
    const data = companies.map(({ _count, ...company }) => ({
      ...company,
      openJobCount: _count.jobs,
    }));
    res.json({ data });
  });

  // One company with its open jobs, newest first.
  router.get("/:id", async (req, res) => {
    const { id } = IdParamsSchema.parse(req.params);
    const company = await db.company.findUnique({
      where: { id },
      include: {
        jobs: { where: { status: "OPEN" }, orderBy: [{ postedAt: "desc" }, { id: "desc" }] },
      },
    });
    if (!company) throw notFound("Company not found");
    res.json(company);
  });

  return router;
};
