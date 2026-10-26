import request from "supertest";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import {
  CompanyListResponseSchema,
  CompanyWithJobsSchema,
  JobListResponseSchema,
  ErrorResponseSchema,
  JobSchema,
} from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { createTestApp } from "../testApp";

const db = createPrismaClient(inject("databaseUrl"));
const app = createTestApp({ db });

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.$executeRawUnsafe(
    'TRUNCATE "Application", "Job", "Company", "User" RESTART IDENTITY CASCADE',
  );
});

// Parses an error response body, failing the test if it has the wrong shape.
const errorOf = (res: { body: unknown }) => ErrorResponseSchema.parse(res.body).error;

const createCompany = (name: string) => db.company.create({ data: { name } });

type JobOverrides = Partial<Prisma.JobUncheckedCreateInput>;

const createJob = (companyId: string, overrides: JobOverrides = {}) =>
  db.job.create({
    data: {
      title: "Developer",
      description: "Write code.",
      type: "FULL_TIME",
      location: "Fredericton, NB",
      companyId,
      ...overrides,
    },
  });

const listJobs = async (query: Record<string, string>) => {
  const res = await request(app).get("/api/v1/jobs").query(query);
  expect(res.status).toBe(200);
  return JobListResponseSchema.parse(res.body);
};

// Follows nextCursor until the last page and returns all job titles.
const collectTitles = async (query: Record<string, string>) => {
  const titles: string[] = [];
  let cursor: string | null = null;
  do {
    const page = await listJobs(cursor ? { ...query, cursor } : query);
    titles.push(...page.data.map((job) => job.title));
    cursor = page.nextCursor;
  } while (cursor);
  return titles;
};

const newJobBody = {
  title: "Junior Developer",
  description: "Build things.",
  type: "FULL_TIME",
  location: "Fredericton, NB",
  salaryMin: 50000,
  salaryMax: 60000,
  company: { name: "Acme", contactEmail: "jobs@acme.test" },
};

describe("POST /api/v1/jobs", () => {
  it("creates a job and its company, then reuses the company case-insensitively", async () => {
    const first = await request(app).post("/api/v1/jobs").send(newJobBody);
    expect(first.status).toBe(201);
    const job = JobSchema.parse(first.body);
    expect(job).toMatchObject({ title: "Junior Developer", remote: "ONSITE", currency: "CAD" });
    expect(job.company).toMatchObject({ name: "Acme", contactEmail: "jobs@acme.test" });

    const second = await request(app)
      .post("/api/v1/jobs")
      .send({ ...newJobBody, company: { name: "ACME" } });
    expect(second.status).toBe(201);
    expect(JobSchema.parse(second.body).companyId).toBe(job.companyId);
    expect(await db.company.count()).toBe(1);
  });

  it("returns 400 with details for an invalid body", async () => {
    const res = await request(app)
      .post("/api/v1/jobs")
      .send({ ...newJobBody, type: "Full-Time", salaryMin: 90000 });
    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("VALIDATION_ERROR");
    expect(errorOf(res).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "type" })]),
    );
  });

  it("returns 400 for an unknown companyId", async () => {
    const { company: _company, ...body } = newJobBody;
    const res = await request(app)
      .post("/api/v1/jobs")
      .send({ ...body, companyId: "missing" });
    expect(res.status).toBe(400);
    expect(errorOf(res).message).toBe("Company not found");
  });

  it("returns 409 for a duplicate source and externalId", async () => {
    const body = { ...newJobBody, source: "GREENHOUSE", externalId: "gh-1" };
    expect((await request(app).post("/api/v1/jobs").send(body)).status).toBe(201);
    const res = await request(app).post("/api/v1/jobs").send(body);
    expect(res.status).toBe(409);
    expect(errorOf(res).code).toBe("CONFLICT");
  });
});

describe("GET, PATCH and DELETE /api/v1/jobs/:id", () => {
  it("returns 404 for a missing job", async () => {
    for (const res of [
      await request(app).get("/api/v1/jobs/missing"),
      await request(app).patch("/api/v1/jobs/missing").send({ title: "x" }),
      await request(app).delete("/api/v1/jobs/missing"),
    ]) {
      expect(res.status).toBe(404);
      expect(errorOf(res).code).toBe("NOT_FOUND");
    }
  });

  it("updates only the sent fields", async () => {
    const company = await createCompany("Acme");
    const job = await createJob(company.id, { salaryMin: 50000, salaryMax: 60000, tags: ["react"] });
    const res = await request(app).patch(`/api/v1/jobs/${job.id}`).send({ title: "Senior" });
    expect(res.status).toBe(200);
    expect(JobSchema.parse(res.body)).toMatchObject({
      title: "Senior",
      salaryMin: 50000,
      salaryMax: 60000,
      tags: ["react"],
    });
  });

  it("rejects a PATCH that would make salaryMin exceed the stored salaryMax", async () => {
    const company = await createCompany("Acme");
    const job = await createJob(company.id, { salaryMin: 50000, salaryMax: 60000 });
    const res = await request(app).patch(`/api/v1/jobs/${job.id}`).send({ salaryMin: 70000 });
    expect(res.status).toBe(400);
    expect(errorOf(res).details).toEqual([
      { path: "salaryMax", message: "salaryMax must be greater than or equal to salaryMin" },
    ]);
  });

  it("deletes a job", async () => {
    const company = await createCompany("Acme");
    const job = await createJob(company.id);
    expect((await request(app).delete(`/api/v1/jobs/${job.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/v1/jobs/${job.id}`)).status).toBe(404);
  });
});

describe("GET /api/v1/jobs filters", () => {
  beforeEach(async () => {
    const acme = await createCompany("Acme Robotics");
    const globex = await createCompany("Globex");
    await createJob(acme.id, {
      title: "React Developer",
      type: "FULL_TIME",
      remote: "REMOTE",
      location: "Fredericton, NB",
      salaryMin: 70000,
      salaryMax: 80000,
      tags: ["react", "typescript"],
    });
    await createJob(globex.id, {
      title: "Data Intern",
      description: "Work with Python.",
      type: "INTERNSHIP",
      location: "Moncton, NB",
      salaryMin: 30000,
      tags: ["python"],
    });
    await createJob(globex.id, { title: "Closed Role", status: "CLOSED", salaryMax: 200000 });
    await createJob(globex.id, { title: "Unpaid Listing", location: "Saint John, NB" });
  });

  const titles = async (query: Record<string, string>) =>
    (await listJobs(query)).data.map((job) => job.title).sort();

  it("lists open jobs only by default", async () => {
    expect(await titles({})).toEqual(["Data Intern", "React Developer", "Unpaid Listing"]);
    expect(await titles({ status: "CLOSED" })).toEqual(["Closed Role"]);
  });

  it("searches title, description and company name case-insensitively", async () => {
    expect(await titles({ q: "react" })).toEqual(["React Developer"]);
    expect(await titles({ q: "PYTHON" })).toEqual(["Data Intern"]);
    expect(await titles({ q: "robotics" })).toEqual(["React Developer"]);
  });

  it("filters by type, remote, location and tags", async () => {
    expect(await titles({ type: "INTERNSHIP" })).toEqual(["Data Intern"]);
    expect(await titles({ remote: "REMOTE" })).toEqual(["React Developer"]);
    expect(await titles({ location: "moncton" })).toEqual(["Data Intern"]);
    expect(await titles({ tags: "react,typescript" })).toEqual(["React Developer"]);
    expect(await titles({ tags: "react,python" })).toEqual([]);
  });

  it("filters by minimum salary using salaryMax, or salaryMin when there is no max", async () => {
    expect(await titles({ salaryMin: "75000" })).toEqual(["React Developer"]);
    expect(await titles({ salaryMin: "30000" })).toEqual(["Data Intern", "React Developer"]);
  });

  it("rejects invalid query parameters", async () => {
    for (const query of [{ limit: "51" }, { type: "FULLTIME" }, { cursor: "not-a-cursor" }, { page: "2" }]) {
      const res = await request(app).get("/api/v1/jobs").query(query);
      expect(res.status).toBe(400);
      expect(errorOf(res).code).toBe("VALIDATION_ERROR");
    }
  });
});

describe("GET /api/v1/jobs pagination", () => {
  beforeEach(async () => {
    const company = await createCompany("Acme");
    const postedAt = new Date("2026-01-01T00:00:00Z");
    // Two jobs share a postedAt and two have no salary at all, to exercise
    // the id tie-breaker and the trailing NULL group.
    const jobs: JobOverrides[] = [
      { title: "A", salaryMin: 40000, salaryMax: 50000, postedAt: new Date("2026-01-05T00:00:00Z") },
      { title: "B", salaryMin: 60000, salaryMax: 90000, postedAt },
      { title: "C", salaryMin: 60000, salaryMax: 70000, postedAt },
      { title: "D", salaryMin: null, salaryMax: null, postedAt: new Date("2025-12-01T00:00:00Z") },
      { title: "E", salaryMin: 80000, salaryMax: null, postedAt: new Date("2026-02-01T00:00:00Z") },
      { title: "F", salaryMin: null, salaryMax: null, postedAt: new Date("2025-11-01T00:00:00Z") },
    ];
    for (const job of jobs) await createJob(company.id, job);
  });

  it("pages through every job exactly once for each sort", async () => {
    for (const sort of ["newest", "salary_desc", "salary_asc"]) {
      const all = await collectTitles({ sort, limit: "50" });
      const paged = await collectTitles({ sort, limit: "2" });
      expect(paged).toEqual(all);
      expect([...paged].sort()).toEqual(["A", "B", "C", "D", "E", "F"]);
    }
  });

  // Ties (same postedAt or salary, or no salary) are ordered by id, so tied
  // jobs are compared as sets.
  const groups = (titles: string[], sizes: number[]) => {
    let start = 0;
    return sizes.map((size) => new Set(titles.slice(start, (start += size))));
  };

  it("orders by postedAt, salaryMax and salaryMin with missing salaries last", async () => {
    const newest = await collectTitles({ sort: "newest", limit: "2" });
    expect(groups(newest, [1, 1, 2, 1, 1])).toEqual(
      [["E"], ["A"], ["B", "C"], ["D"], ["F"]].map((g) => new Set(g)),
    );

    // salary_desc uses salaryMax; E has only a salaryMin, so it is in the NULL group.
    const desc = await collectTitles({ sort: "salary_desc", limit: "2" });
    expect(groups(desc, [1, 1, 1, 3])).toEqual(
      [["B"], ["C"], ["A"], ["D", "E", "F"]].map((g) => new Set(g)),
    );

    const asc = await collectTitles({ sort: "salary_asc", limit: "2" });
    expect(groups(asc, [1, 2, 1, 2])).toEqual(
      [["A"], ["B", "C"], ["E"], ["D", "F"]].map((g) => new Set(g)),
    );
  });

  it("returns nextCursor null on the last page and rejects a cursor from another sort", async () => {
    const first = await listJobs({ sort: "newest", limit: "5" });
    expect(first.nextCursor).not.toBeNull();
    const last = await listJobs({ sort: "newest", limit: "5", cursor: first.nextCursor ?? "" });
    expect(last.data).toHaveLength(1);
    expect(last.nextCursor).toBeNull();

    const res = await request(app)
      .get("/api/v1/jobs")
      .query({ sort: "salary_asc", cursor: first.nextCursor ?? "" });
    expect(res.status).toBe(400);
  });
});

describe("/api/v1/companies", () => {
  it("lists companies with open job counts and shows one with its open jobs", async () => {
    const acme = await createCompany("Acme");
    await createJob(acme.id, { title: "Open" });
    await createJob(acme.id, { title: "Closed", status: "CLOSED" });
    await createCompany("Beta");

    const list = await request(app).get("/api/v1/companies");
    expect(list.status).toBe(200);
    expect(
      CompanyListResponseSchema.parse(list.body).data.map(
        ({ name, openJobCount }) => ({ name, openJobCount }),
      ),
    ).toEqual([
      { name: "Acme", openJobCount: 1 },
      { name: "Beta", openJobCount: 0 },
    ]);

    const one = await request(app).get(`/api/v1/companies/${acme.id}`);
    expect(one.status).toBe(200);
    expect(CompanyWithJobsSchema.parse(one.body).jobs.map((job) => job.title)).toEqual(["Open"]);

    expect((await request(app).get("/api/v1/companies/missing")).status).toBe(404);
  });
});

describe("write rate limit", () => {
  it("returns 429 in the error shape once the limit is reached", async () => {
    const limited = createTestApp({ db, writeRateLimit: { windowMs: 60_000, limit: 1 } });
    expect((await request(limited).post("/api/v1/jobs").send(newJobBody)).status).toBe(201);
    const res = await request(limited).post("/api/v1/jobs").send(newJobBody);
    expect(res.status).toBe(429);
    expect(errorOf(res).code).toBe("RATE_LIMITED");
    // Reads are not rate limited.
    expect((await request(limited).get("/api/v1/jobs")).status).toBe(200);
  });
});
