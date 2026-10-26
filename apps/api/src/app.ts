import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { Db } from "./db";
import { notFound } from "./errors";
import { createErrorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";

export type AppOptions = {
  db: Db;
  logger: Logger;
  corsOrigins: string[];
  // Include stack traces in 500 responses. Only true in development.
  exposeErrorStack: boolean;
};

export const createApp = ({ db, logger, corsOrigins, exposeErrorStack }: AppOptions) => {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  const v1 = express.Router();
  v1.use("/health", healthRouter(db));
  app.use("/api/v1", v1);

  app.use((req, _res, next) => {
    next(notFound(`Route ${req.method} ${req.path} not found`));
  });
  app.use(createErrorHandler({ exposeStack: exposeErrorStack }));

  return app;
};
