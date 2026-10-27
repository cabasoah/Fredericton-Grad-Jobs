import { existsSync } from "node:fs";
import { z } from "zod";

// The development-only value in apps/api/.env.example.
const EXAMPLE_JWT_SECRET = "dev-only-insecure-jwt-secret-change-me-0000";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().min(1),
  // Signs session JWTs. At least 32 characters of random data.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  // Comma-separated list of allowed origins, e.g. "http://localhost:3000".
  CORS_ORIGIN: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // "true" runs job ingestion every 6 hours inside the API process.
  INGEST_CRON: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // Number of reverse proxies in front of the API (nginx, a hosting
  // platform's load balancer). Rate limits key on the client IP, which is
  // only correct when this matches. 0 = no proxy.
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  // Mark the session cookie Secure (HTTPS only). Defaults to true in
  // production; set "false" only for production builds served over plain
  // HTTP on localhost (the docker compose stack).
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
}).refine((env) => !(env.NODE_ENV === "production" && env.JWT_SECRET === EXAMPLE_JWT_SECRET), {
  path: ["JWT_SECRET"],
  message: "Replace the example JWT_SECRET from .env.example before running in production",
});

export type Env = z.infer<typeof EnvSchema>;

export const secureCookies = (env: Pick<Env, "NODE_ENV" | "COOKIE_SECURE">) =>
  env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : env.NODE_ENV === "production";

// Reads .env from the working directory (apps/api) if present, then validates.
export const loadEnv = (): Env => {
  if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  return parseEnv(process.env);
};

export const parseEnv = (source: Record<string, string | undefined>): Env => {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment (see apps/api/.env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
};
