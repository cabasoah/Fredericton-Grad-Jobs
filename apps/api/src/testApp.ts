import { pino } from "pino";
import { createApp, type AppOptions } from "./app";
import { createPrismaClient } from "./db";

// App instance for tests. The Prisma client connects lazily, so tests that
// never reach the database do not need one running.
export const createTestApp = (overrides: Partial<AppOptions> = {}) =>
  createApp({
    db: createPrismaClient(process.env.DATABASE_URL ?? "postgresql://test:test@localhost:1/test"),
    logger: pino({ level: "silent" }),
    corsOrigins: ["http://localhost:3000"],
    exposeErrorStack: false,
    ...overrides,
  });
