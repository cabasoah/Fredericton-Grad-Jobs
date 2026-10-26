import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { TestProject } from "vitest/node";
import { createPrismaClient } from "../db";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

// Creates (if needed) and migrates a test database next to DATABASE_URL,
// e.g. .../jobs -> .../jobs_test, then hands its URL to the tests.
export default async function setup(project: TestProject) {
  if (existsSync(".env")) process.loadEnvFile(".env");
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
  }

  const url = new URL(baseUrl);
  const databaseName = `${url.pathname.slice(1)}_test`;
  if (!/^[a-z0-9_]+$/i.test(databaseName)) {
    throw new Error(`Unexpected database name: ${databaseName}`);
  }
  url.pathname = `/${databaseName}`;
  const testUrl = url.toString();

  const admin = createPrismaClient(baseUrl);
  try {
    const existing = await admin.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${databaseName}) AS "exists"`;
    if (!existing[0]?.exists) {
      // Identifiers cannot be bound as parameters; the name is checked above.
      await admin.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.$disconnect();
  }

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "ignore",
  });

  project.provide("databaseUrl", testUrl);
}
