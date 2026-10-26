import { existsSync } from "node:fs";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().min(1),
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
});

export type Env = z.infer<typeof EnvSchema>;

// Reads .env from the working directory (apps/api) if present, then validates.
export const loadEnv = (): Env => {
  if (existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment (see apps/api/.env.example):\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
};
