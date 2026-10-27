import { execSync } from "node:child_process";
import { createPrismaClient } from "../db";

// Prepares the database for the Playwright tests (e2e/): creates it if
// needed, applies migrations, empties every table and adds a few known
// jobs. Run with DATABASE_URL pointing at a database whose name ends in
// _e2e; e2e/playwright.config.ts does this before starting the API.
const url = new URL(process.env.DATABASE_URL ?? "");
const databaseName = url.pathname.slice(1);
if (!/^[a-z0-9_]+_e2e$/i.test(databaseName)) {
  throw new Error(`Refusing to reset "${databaseName}": the e2e database name must end in _e2e`);
}

const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";
const admin = createPrismaClient(adminUrl.toString());
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

execSync("npx prisma migrate deploy", { stdio: "ignore" });

const db = createPrismaClient(url.toString());
try {
  await db.$executeRawUnsafe(
    'TRUNCATE "ApplicationEvent", "Application", "Job", "Company", "User", "IngestRun" RESTART IDENTITY CASCADE',
  );
  const acme = await db.company.create({ data: { name: "Acme Analytics", contactEmail: "jobs@acme.example" } });
  const beta = await db.company.create({ data: { name: "Beta Labs" } });
  await db.job.createMany({
    data: [
      {
        title: "Junior Data Analyst",
        description: "Build dashboards and clean data with SQL.",
        type: "PART_TIME",
        remote: "HYBRID",
        location: "Moncton, NB",
        salaryMin: 45000,
        salaryMax: 52000,
        tags: ["sql"],
        companyId: acme.id,
        postedAt: new Date("2026-10-20T12:00:00Z"),
      },
      {
        title: "Senior Data Engineer",
        description: "Own the data platform.",
        type: "FULL_TIME",
        remote: "ONSITE",
        location: "Fredericton, NB",
        salaryMin: 95000,
        salaryMax: 120000,
        tags: ["python", "sql"],
        companyId: acme.id,
        postedAt: new Date("2026-10-21T12:00:00Z"),
      },
      {
        title: "Frontend Developer",
        description: "Build React interfaces.",
        type: "FULL_TIME",
        remote: "REMOTE",
        location: "Saint John, NB",
        tags: ["react"],
        companyId: beta.id,
        postedAt: new Date("2026-10-22T12:00:00Z"),
      },
    ],
  });
} finally {
  await db.$disconnect();
}
