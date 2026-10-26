import { Router } from "express";
import type { Db } from "../db";

export const healthRouter = (db: Db) => {
  const router = Router();

  // 200 when the API can reach the database, 503 otherwise.
  router.get("/", async (req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "ok" });
    } catch (err) {
      req.log.warn({ err }, "Health check: database unreachable");
      res.status(503).json({ status: "error", database: "unreachable" });
    }
  });

  return router;
};
