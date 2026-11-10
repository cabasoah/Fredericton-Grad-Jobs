import { existsSync } from "node:fs";
import path from "node:path";
import { pino } from "pino";
import { createApp } from "./app";
import { createPrismaClient } from "./db";
import { loadEnv, secureCookies } from "./env";
import { startIngestSchedule } from "./ingest/schedule";

const env = loadEnv();
const logger = pino({ level: env.LOG_LEVEL });
const db = createPrismaClient(env.DATABASE_URL);

const webDistDir = env.WEB_DIST_DIR ? path.resolve(env.WEB_DIST_DIR) : undefined;
if (webDistDir && !existsSync(path.join(webDistDir, "index.html"))) {
  throw new Error(`WEB_DIST_DIR has no index.html: ${webDistDir} (run npm run build first)`);
}
if (webDistDir) {
  logger.info(`Serving the web app from ${webDistDir}`);
}

const app = createApp({
  db,
  logger,
  corsOrigins: env.CORS_ORIGIN,
  session: { secret: env.JWT_SECRET, secureCookies: secureCookies(env) },
  trustProxyHops: env.TRUST_PROXY,
  webDistDir,
  exposeErrorStack: env.NODE_ENV === "development",
});

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, "Failed to start API");
    process.exit(1);
  }
  logger.info(`API listening on http://localhost:${env.PORT}/api/v1`);
});

const ingestTask = env.INGEST_CRON ? startIngestSchedule(db, logger) : null;

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down`);
  void ingestTask?.stop();
  server.close(() => {
    void db.$disconnect().finally(() => process.exit(0));
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
