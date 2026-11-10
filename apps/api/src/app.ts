import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { Db } from "./db";
import type { SessionConfig } from "./auth/session";
import { notFound } from "./errors";
import { createErrorHandler } from "./middleware/errorHandler";
import {
  createLoginRateLimiters,
  createWriteRateLimiter,
  DEFAULT_LOGIN_RATE_LIMIT,
  DEFAULT_WRITE_RATE_LIMIT,
  type LoginRateLimitOptions,
  type RateLimitOptions,
} from "./middleware/rateLimit";
import { applicationsRouter } from "./routes/applications";
import { authRouter } from "./routes/auth";
import { companiesRouter } from "./routes/companies";
import { healthRouter } from "./routes/health";
import { jobsRouter } from "./routes/jobs";
import { statsRouter } from "./routes/stats";

export type AppOptions = {
  db: Db;
  logger: Logger;
  corsOrigins: string[];
  session: SessionConfig;
  // Include stack traces in 500 responses. Only true in development.
  exposeErrorStack: boolean;
  writeRateLimit?: RateLimitOptions;
  loginRateLimit?: LoginRateLimitOptions;
  // Reverse proxies in front of the API, so req.ip (and the rate limits)
  // see the client's address rather than the proxy's.
  trustProxyHops?: number;
  // Absolute path to the built web app (apps/web/dist). When set, the API
  // also serves the app, so both share one origin on hosts without a
  // rewrite proxy. Unset = API only (nginx or Vercel serves the app).
  webDistDir?: string;
};

export const createApp = ({
  db,
  logger,
  corsOrigins,
  session,
  exposeErrorStack,
  writeRateLimit = DEFAULT_WRITE_RATE_LIMIT,
  loginRateLimit = DEFAULT_LOGIN_RATE_LIMIT,
  trustProxyHops = 0,
  webDistDir,
}: AppOptions) => {
  const app = express();
  app.set("trust proxy", trustProxyHops);
  // Shared by all write routes so they count against one limit per client.
  const writeLimiter = createWriteRateLimiter(writeRateLimit);

  // Never write session cookies to the logs.
  app.use(
    pinoHttp({
      logger: logger.child({}, { redact: ["req.headers.cookie", 'res.headers["set-cookie"]'] }),
    }),
  );
  app.use(helmet());
  // credentials: true lets the web app send and receive the session cookie.
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const v1 = express.Router();
  v1.use("/health", healthRouter(db));
  v1.use("/auth", authRouter(db, session, createLoginRateLimiters(loginRateLimit)));
  v1.use("/jobs", jobsRouter(db, session, writeLimiter));
  v1.use("/companies", companiesRouter(db));
  v1.use("/stats", statsRouter(db));
  v1.use("/applications", applicationsRouter(db, session));
  app.use("/api/v1", v1);

  if (webDistDir) {
    // Same caching as nginx.conf.template: Vite puts a content hash in every
    // asset file name, so assets never change; everything else revalidates.
    app.use(
      "/assets",
      express.static(path.join(webDistDir, "assets"), { immutable: true, maxAge: "1y" }),
    );
    app.use(
      express.static(webDistDir, {
        index: false,
        setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
      }),
    );
    // Client-side routes (/jobs/123, /tracker) all load index.html. Unknown
    // /api and /assets paths fall through to the JSON 404 below.
    const indexHtml = path.join(webDistDir, "index.html");
    app.use((req, res, next) => {
      const isPage =
        (req.method === "GET" || req.method === "HEAD") &&
        !/^\/(api|assets)(\/|$)/.test(req.path);
      if (!isPage) return next();
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexHtml, (error) => {
        if (error) next(error);
      });
    });
  }

  app.use((req, _res, next) => {
    next(notFound(`Route ${req.method} ${req.path} not found`));
  });
  app.use(createErrorHandler({ exposeStack: exposeErrorStack }));

  return app;
};
