import cron from "node-cron";
import type { Logger } from "pino";
import type { Db } from "../db";
import { INGEST_TARGETS } from "./companies";
import { runIngest } from "./run";

// Every 6 hours, on the hour (00:00, 06:00, 12:00, 18:00 server time).
export const INGEST_SCHEDULE = "0 */6 * * *";

// Started by the API process when INGEST_CRON=true. noOverlap skips a run
// if the previous one is still going.
export const startIngestSchedule = (db: Db, logger: Logger) => {
  const task = cron.schedule(
    INGEST_SCHEDULE,
    async () => {
      try {
        await runIngest({ db, logger, targets: INGEST_TARGETS });
      } catch (err) {
        logger.error({ err }, "scheduled ingest failed");
      }
    },
    { name: "ingest", noOverlap: true },
  );
  logger.info(`Ingest scheduled (${INGEST_SCHEDULE}); next run at ${task.getNextRun()?.toISOString() ?? "unknown"}`);
  return task;
};
