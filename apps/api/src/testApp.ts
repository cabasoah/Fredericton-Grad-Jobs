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
    session: { secret: "test-secret-that-is-at-least-32-characters", secureCookies: false },
    exposeErrorStack: false,
    // Tests sign in many times from one IP; rate-limit tests pass low limits.
    loginRateLimit: {
      perIp: { windowMs: 60_000, limit: 10_000 },
      perEmail: { windowMs: 60_000, limit: 10_000 },
    },
    ...overrides,
  });
