import request from "supertest";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import {
  CompanyListResponseSchema,
  CompanyWithJobsSchema,
  ErrorResponseSchema,
  JobListResponseSchema,
  JobSchema,
} from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../db";
import {
  createCompany,
  createEmployer,
  createJob,
  createSeeker,
  resetDb,
  signedInAgent,
  type JobOverrides,
} from "../test/fixtures";
import { createTestApp } from "../testApp";

const db = createPrismaClient(inject("databaseUrl"));
const app = createTestApp({ db });

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDb(db);
});

// Parses an error response body, failing the test if it has the wrong shape.
const errorOf = (res: { body: unknown }) => ErrorResponseSchema.parse(res.body).error;

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
};

describe("POST /api/v1/jobs", () => {
  it("lets an employer post a job for their own company", async () => {
    const { user, company } = await createEmployer(db, "erin@acme.test", "Acme");
    const agent = await signedInAgent(app, "erin@acme.test");

    const res = await agent.post("/api/v1/jobs").send(newJobBody);
    expect(res.status).toBe(201);
    expect(JobSchema.parse(res.body)).toMatchObject({
      title: "Junior Developer",
      remote: "ONSITE",
      currency: "CAD",
      source: "MANUAL",
      companyId: company.id,
      postedById: user.id,
    });
  });

  it("returns 401 without a session cookie", async () => {
    const res = await request(app).post("/api/v1/jobs").send(newJobBody);
    expect(res.status).toBe(401);
    expect(errorOf(res).code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for a job seeker", async () => {
    await createSeeker(db, "sam@example.test");
    const agent = await signedInAgent(app, "sam@example.test");
    const res = await agent.post("/api/v1/jobs").send(newJobBody);
    expect(res.status).toBe(403);
    expect(errorOf(res)).toEqual({ code: "FORBIDDEN", message: "Your account type cannot do this" });
  });

  it("returns 400 with details for an invalid body, including client-chosen company or source", async () => {
    await createEmployer(db, "erin@acme.test", "Acme");
    const agent = await signedInAgent(app, "erin@acme.test");
    const res = await agent
      .post("/api/v1/jobs")
      .send({ ...newJobBody, type: "Full-Time", salaryMin: 90000 });
    expect(res.status).toBe(400);
    expect(errorOf(res).code).toBe("VALIDATION_ERROR");
    expect(errorOf(res).details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "type" })]),
    );

    for (const extra of [{ companyId: "other" }, { source: "GREENHOUSE" }, { postedById: "x" }]) {
      expect((await agent.post("/api/v1/jobs").send({ ...newJobBody, ...extra })).status).toBe(400);
    }
  });
});

describe("PATCH and DELETE /api/v1/jobs/:id", () => {
  // Erin (Acme) owns the job; Olga (Globex) is another employer.
  const setup = async (overrides: JobOverrides = {}) => {
    const { user, company } = await createEmployer(db, "erin@acme.test", "Acme");
    await createEmployer(db, "olga@globex.test", "Globex");
    const job = await createJob(db, company.id, {
      postedById: user.id,
      salaryMin: 50000,
      salaryMax: 60000,
      tags: ["react"],
      ...overrides,
    });
    return {
      job,
      owner: await signedInAgent(app, "erin@acme.test"),
      other: await signedInAgent(app, "olga@globex.test"),
    };
  };

  it("returns 404 for a missing job", async () => {
    const { owner } = await setup();
    for (const res of [
      await request(app).get("/api/v1/jobs/missing"),
      await owner.patch("/api/v1/jobs/missing").send({ title: "x" }),
      await owner.delete("/api/v1/jobs/missing"),
    ]) {
      expect(res.status).toBe(404);
      expect(errorOf(res).code).toBe("NOT_FOUND");
    }
  });

  it("returns 401 without a session cookie", async () => {
    const { job } = await setup();
    expect((await request(app).patch(`/api/v1/jobs/${job.id}`).send({ title: "x" })).status).toBe(401);
    expect((await request(app).delete(`/api/v1/jobs/${job.id}`)).status).toBe(401);
  });

  it("returns 403 when another employer tries to edit or delete the job", async () => {
    const { job, other } = await setup();
    const patch = await other.patch(`/api/v1/jobs/${job.id}`).send({ title: "Hijacked" });
    expect(patch.status).toBe(403);
    const del = await other.delete(`/api/v1/jobs/${job.id}`);
    expect(del.status).toBe(403);
    expect(errorOf(del)).toEqual({
      code: "FORBIDDEN",
      message: "Only the employer who posted this job can change it",
    });
    expect(await db.job.findUnique({ where: { id: job.id } })).toMatchObject({ title: "Developer" });
  });

  it("returns 403 for imported jobs, even for the employer who owns them", async () => {
    const { job, owner } = await setup({ source: "GREENHOUSE", externalId: "gh-1" });
    const res = await owner.delete(`/api/v1/jobs/${job.id}`);
    expect(res.status).toBe(403);
    expect(errorOf(res).message).toBe("Imported jobs cannot be edited or deleted");
    expect((await owner.patch(`/api/v1/jobs/${job.id}`).send({ title: "x" })).status).toBe(403);
  });

  it("lets the owner update only the sent fields", async () => {
    const { job, owner } = await setup();
    const res = await owner.patch(`/api/v1/jobs/${job.id}`).send({ title: "Senior" });
    expect(res.status).toBe(200);
    expect(JobSchema.parse(res.body)).toMatchObject({
      title: "Senior",
      salaryMin: 50000,
      salaryMax: 60000,
      tags: ["react"],
    });
  });

  it("rejects a PATCH that would make salaryMin exceed the stored salaryMax", async () => {
    const { job, owner } = await setup();
    const res = await owner.patch(`/api/v1/jobs/${job.id}`).send({ salaryMin: 70000 });
    expect(res.status).toBe(400);
    expect(errorOf(res).details).toEqual([
      { path: "salaryMax", message: "salaryMax must be greater than or equal to salaryMin" },
    ]);
  });

  it("lets the owner delete the job", async () => {
    const { job, owner } = await setup();
    expect((await owner.delete(`/api/v1/jobs/${job.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/v1/jobs/${job.id}`)).status).toBe(404);
  });
});

describe("GET /api/v1/jobs filters", () => {
  beforeEach(async () => {
    const acme = await createCompany(db, "Acme Robotics");
    const globex = await createCompany(db, "Globex");
    await createJob(db, acme.id, {
      title: "React Developer",
      type: "FULL_TIME",
      remote: "REMOTE",
      location: "Fredericton, NB",
      salaryMin: 70000,
      salaryMax: 80000,
      tags: ["react", "typescript"],
    });
    await createJob(db, globex.id, {
      title: "Data Intern",
      description: "Work with Python.",
      type: "INTERNSHIP",
      location: "Moncton, NB",
      salaryMin: 30000,
      tags: ["python"],
    });
    await createJob(db, globex.id, { title: "Closed Role", status: "CLOSED", salaryMax: 200000 });
    await createJob(db, globex.id, { title: "Unpaid Listing", location: "Saint John, NB" });
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
    const company = await createCompany(db, "Acme");
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
    for (const job of jobs) await createJob(db, company.id, job);
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
    const acme = await createCompany(db, "Acme");
    await createJob(db, acme.id, { title: "Open" });
    await createJob(db, acme.id, { title: "Closed", status: "CLOSED" });
    await createCompany(db, "Beta");

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
    await createEmployer(db, "erin@acme.test", "Acme");
    const agent = await signedInAgent(limited, "erin@acme.test");
    expect((await agent.post("/api/v1/jobs").send(newJobBody)).status).toBe(201);
    const res = await agent.post("/api/v1/jobs").send(newJobBody);
    expect(res.status).toBe(429);
    expect(errorOf(res).code).toBe("RATE_LIMITED");
    // Reads are not rate limited.
    expect((await agent.get("/api/v1/jobs")).status).toBe(200);
  });
});
