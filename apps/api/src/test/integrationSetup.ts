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

  // TEST_DATABASE_URL picks the test database explicitly; otherwise it is
  // DATABASE_URL's database with a _test suffix.
  const url = new URL(process.env.TEST_DATABASE_URL ?? baseUrl);
  if (!process.env.TEST_DATABASE_URL) url.pathname = `${url.pathname}_test`;
  const databaseName = url.pathname.slice(1);
  if (!/^[a-z0-9_]+$/i.test(databaseName)) {
    throw new Error(`Unexpected database name: ${databaseName}`);
  }
  // Every test truncates the tables, so never point it at the dev database.
  if (databaseName === new URL(baseUrl).pathname.slice(1)) {
    throw new Error("TEST_DATABASE_URL must name a different database than DATABASE_URL");
  }
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
