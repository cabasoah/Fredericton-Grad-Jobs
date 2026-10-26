// `npm run ingest`: pulls every company in companies.ts once, then prints
// the IngestRun rows written by this run.
import { pino } from "pino";
import { createPrismaClient } from "../db";
import { loadEnv } from "../env";
import { INGEST_TARGETS } from "./companies";
import { runIngest } from "./run";

const env = loadEnv();
const logger = pino({ level: env.LOG_LEVEL });
const db = createPrismaClient(env.DATABASE_URL);

const main = async () => {
  const { batchId } = await runIngest({ db, logger, targets: INGEST_TARGETS });
  const rows = await db.ingestRun.findMany({
    where: { batchId },
    orderBy: { startedAt: "asc" },
    select: {
      source: true,
      company: true,
      startedAt: true,
      finishedAt: true,
      fetched: true,
      created: true,
      updated: true,
      closed: true,
      errors: true,
      errorDetail: true,
    },
  });
  console.log(`\nIngestRun rows for batch ${batchId} (read back from the database):`);
  console.table(
    rows.map((row) => ({
      ...row,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
    })),
  );
  if (rows.some((row) => row.errors > 0)) process.exitCode = 1;
};

main()
  .catch((err: unknown) => {
    logger.fatal({ err }, "ingest failed");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
