import { Router } from "express";
import { JOB_SOURCES, type Stats } from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";

export const statsRouter = (db: Db) => {
  const router = Router();

  router.get("/", async (_req, res) => {
    const [bySource, lastSuccess] = await Promise.all([
      db.job.groupBy({ by: ["source"], where: { status: "OPEN" }, _count: { _all: true } }),
      // A run row is successful when it finished with no errors.
      db.ingestRun.findFirst({
        where: { finishedAt: { not: null }, errors: 0 },
        orderBy: { finishedAt: "desc" },
        select: { finishedAt: true },
      }),
    ]);

    const openJobsBySource = Object.fromEntries(JOB_SOURCES.map((source) => [source, 0])) as Stats["openJobsBySource"];
    for (const row of bySource) openJobsBySource[row.source] = row._count._all;

    const stats: Stats = {
      openJobs: Object.values(openJobsBySource).reduce((sum, count) => sum + count, 0),
      openJobsBySource,
      lastSuccessfulIngestAt: lastSuccess?.finishedAt?.toISOString() ?? null,
    };
    res.json(stats);
  });

  return router;
};
