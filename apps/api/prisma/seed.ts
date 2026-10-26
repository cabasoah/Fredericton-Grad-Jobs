// Seeds the database for local development. Run with `npm run db:seed`.
//
// 1. Jobs: loaded from prisma/seed-data/jobs.json (the json-server data file)
//    only when the database has no jobs, so app data is never overwritten.
// 2. Demo employers: for every company with unowned MANUAL jobs, creates (or
//    reuses) a demo employer account and makes it the poster of those jobs,
//    so they can be edited after signing in. Jobs that already have a poster
//    are never touched. Passwords come from SEED_USER_PASSWORD.
import { existsSync, readFileSync } from "node:fs";
import { PASSWORD_MIN_LENGTH } from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../src/db";
import { hashPassword } from "../src/auth/password";
import { convertLegacyJob, LegacyJobsFileSchema } from "../src/seed/legacyJobs";

if (existsSync(".env")) process.loadEnvFile(".env");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
}
const seedPassword = process.env.SEED_USER_PASSWORD ?? "";
if (seedPassword.length < PASSWORD_MIN_LENGTH) {
  throw new Error(
    `SEED_USER_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters (see apps/api/.env.example)`,
  );
}

const db = createPrismaClient(databaseUrl);

// "Port Solutions INC" -> "port-solutions-inc"
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const seedJobs = async () => {
  const existingJobs = await db.job.count();
  if (existingJobs > 0) {
    console.log(`Database already has ${existingJobs} jobs; not loading seed jobs.`);
    return;
  }

  const raw: unknown = JSON.parse(
    readFileSync(new URL("./seed-data/jobs.json", import.meta.url), "utf8"),
  );
  const { jobs } = LegacyJobsFileSchema.parse(raw);
  // Keep the file's order on the newest-first listing: the first job gets the
  // latest postedAt, one minute apart.
  const now = Date.now();

  await db.$transaction(async (tx) => {
    for (const [index, legacyJob] of jobs.entries()) {
      const { job, company } = convertLegacyJob(legacyJob);
      const existingCompany = await tx.company.findFirst({
        where: { name: { equals: company.name, mode: "insensitive" } },
        select: { id: true },
      });
      const companyId = existingCompany
        ? existingCompany.id
        : (await tx.company.create({ data: company, select: { id: true } })).id;
      await tx.job.create({
        data: { ...job, companyId, postedAt: new Date(now - index * 60_000) },
      });
    }
  });

  const companies = await db.company.count();
  console.log(`Seeded ${jobs.length} jobs and ${companies} companies.`);
};

const seedDemoEmployers = async () => {
  const companies = await db.company.findMany({
    where: { jobs: { some: { postedById: null, source: "MANUAL" } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  if (companies.length === 0) {
    console.log("Every seeded job already has a poster; no demo employers needed.");
    return;
  }

  const passwordHash = await hashPassword(seedPassword);
  const accounts: string[] = [];
  for (const company of companies) {
    const email = `${slug(company.name)}@employers.example.com`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `${company.name} (demo)`,
        role: "EMPLOYER",
        companyId: company.id,
        passwordHash,
      },
      select: { id: true, companyId: true },
    });
    if (user.companyId !== company.id) {
      console.warn(`Skipping ${company.name}: ${email} already belongs to another company.`);
      continue;
    }
    const { count } = await db.job.updateMany({
      where: { companyId: company.id, postedById: null, source: "MANUAL" },
      data: { postedById: user.id },
    });
    accounts.push(`  ${email}  (${count} job${count === 1 ? "" : "s"})`);
  }

  console.log("Demo employer accounts (password: SEED_USER_PASSWORD from apps/api/.env):");
  console.log(accounts.join("\n"));
};

const main = async () => {
  await seedJobs();
  await seedDemoEmployers();
};

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
