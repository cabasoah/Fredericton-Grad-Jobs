// Seeds the database from prisma/seed-data/jobs.json (the json-server data
// file). Run with `npm run db:seed`. Does nothing if any jobs already exist,
// so it never overwrites data created through the app.
import { existsSync, readFileSync } from "node:fs";
import { createPrismaClient } from "../src/db";
import { convertLegacyJob, LegacyJobsFileSchema } from "../src/seed/legacyJobs";

if (existsSync(".env")) process.loadEnvFile(".env");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
}

const db = createPrismaClient(databaseUrl);

const main = async () => {
  const existingJobs = await db.job.count();
  if (existingJobs > 0) {
    console.log(`Database already has ${existingJobs} jobs; skipping seed.`);
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

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
