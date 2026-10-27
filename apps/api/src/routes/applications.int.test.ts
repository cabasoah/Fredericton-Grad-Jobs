import request from "supertest";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import {
  ApplicationListResponseSchema,
  ApplicationSchema,
  ApplicationStatsSchema,
  ApplicationWithEventsSchema,
  ErrorResponseSchema,
} from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../db";
import { createCompany, createEmployer, createJob, createSeeker, resetDb, signedInAgent } from "../test/fixtures";
import { createTestApp } from "../testApp";

const db = createPrismaClient(inject("databaseUrl"));
const app = createTestApp({ db });

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDb(db);
});

const errorOf = (res: { body: unknown }) => ErrorResponseSchema.parse(res.body).error;

const external = {
  companyName: "Elsewhere Inc",
  roleTitle: "Junior Developer",
  url: "https://elsewhere.example/jobs/1",
};

const seekers = async () => {
  await createSeeker(db, "sam@example.test");
  await createSeeker(db, "ola@example.test");
  return {
    sam: await signedInAgent(app, "sam@example.test"),
    ola: await signedInAgent(app, "ola@example.test"),
  };
};

describe("stage transitions", () => {
  it("logs the creation stage and every stage change as events, never rewriting history", async () => {
    const { sam } = await seekers();
    const created = ApplicationSchema.parse(
      (await sam.post("/api/v1/applications").send({ ...external, stage: "APPLIED" })).body,
    );
    // Created straight at APPLIED, so appliedAt is set automatically.
    expect(created.appliedAt).not.toBeNull();

    const toOa = await sam.patch(`/api/v1/applications/${created.id}`).send({ stage: "OA" });
    expect(toOa.status).toBe(200);
    const afterOa = ApplicationWithEventsSchema.parse(toOa.body);
    expect(afterOa.events.map(({ fromStage, toStage }) => [fromStage, toStage])).toEqual([
      [null, "APPLIED"],
      ["APPLIED", "OA"],
    ]);

    // Editing other fields, or "changing" to the same stage, adds no event.
    await sam.patch(`/api/v1/applications/${created.id}`).send({ notes: "Did the take-home." });
    await sam.patch(`/api/v1/applications/${created.id}`).send({ stage: "OA" });

    // Moving back is allowed and is appended, not overwritten.
    await sam.patch(`/api/v1/applications/${created.id}`).send({ stage: "APPLIED" });
    const final = ApplicationWithEventsSchema.parse((await sam.get(`/api/v1/applications/${created.id}`)).body);
    expect(final.stage).toBe("APPLIED");
    expect(final.notes).toBe("Did the take-home.");
    expect(final.events.map(({ fromStage, toStage }) => [fromStage, toStage])).toEqual([
      [null, "APPLIED"],
      ["APPLIED", "OA"],
      ["OA", "APPLIED"],
    ]);
    // The first two events are the same rows as before.
    expect(final.events.slice(0, 2)).toEqual(afterOa.events);
  });

  it("sets appliedAt the first time a saved job reaches APPLIED or later, and keeps it", async () => {
    const { sam } = await seekers();
    const company = await createCompany(db, "Acme");
    const job = await createJob(db, company.id, { title: "Backend Developer" });

    const saved = await sam.post("/api/v1/applications").send({ jobId: job.id });
    expect(saved.status).toBe(201);
    const application = ApplicationSchema.parse(saved.body);
    expect(application).toMatchObject({
      jobId: job.id,
      companyName: "Acme",
      roleTitle: "Backend Developer",
      stage: "SAVED",
      appliedAt: null,
    });

    const applied = ApplicationSchema.parse(
      (await sam.patch(`/api/v1/applications/${application.id}`).send({ stage: "APPLIED" })).body,
    );
    expect(applied.appliedAt).not.toBeNull();
    const interview = ApplicationSchema.parse(
      (await sam.patch(`/api/v1/applications/${application.id}`).send({ stage: "INTERVIEW" })).body,
    );
    expect(interview.appliedAt).toBe(applied.appliedAt);

    // A date-only value is stored at 12:00 UTC (same day in Atlantic time).
    const edited = ApplicationSchema.parse(
      (await sam.patch(`/api/v1/applications/${application.id}`).send({ appliedAt: "2026-10-20" })).body,
    );
    expect(edited.appliedAt).toBe("2026-10-20T12:00:00.000Z");
  });

  it("refuses to save the same job twice and returns 404 for an unknown job", async () => {
    const { sam } = await seekers();
    const company = await createCompany(db, "Acme");
    const job = await createJob(db, company.id);
    expect((await sam.post("/api/v1/applications").send({ jobId: job.id })).status).toBe(201);
    const again = await sam.post("/api/v1/applications").send({ jobId: job.id });
    expect(again.status).toBe(409);
    expect(errorOf(again).message).toBe("This job is already in your tracker");
    expect((await sam.post("/api/v1/applications").send({ jobId: "missing" })).status).toBe(404);
  });

  it("keeps the copied details when the job is deleted", async () => {
    const { sam } = await seekers();
    const company = await createCompany(db, "Acme");
    const job = await createJob(db, company.id, { title: "Backend Developer" });
    const { id } = ApplicationSchema.parse((await sam.post("/api/v1/applications").send({ jobId: job.id })).body);
    await db.job.delete({ where: { id: job.id } });
    expect(ApplicationSchema.parse((await sam.get(`/api/v1/applications/${id}`)).body)).toMatchObject({
      jobId: null,
      companyName: "Acme",
      roleTitle: "Backend Developer",
    });
  });
});

describe("isolation between users", () => {
  it("returns 404, not 403, for another user's application and leaves it untouched", async () => {
    const { sam, ola } = await seekers();
    const { id } = ApplicationSchema.parse(
      (await sam.post("/api/v1/applications").send({ ...external, notes: "private" })).body,
    );

    for (const res of [
      await ola.get(`/api/v1/applications/${id}`),
      await ola.patch(`/api/v1/applications/${id}`).send({ stage: "REJECTED" }),
      await ola.delete(`/api/v1/applications/${id}`),
    ]) {
      expect(res.status).toBe(404);
      expect(errorOf(res)).toEqual({ code: "NOT_FOUND", message: "Application not found" });
    }
    // Same response as an id that does not exist at all.
    expect(errorOf(await ola.get("/api/v1/applications/does-not-exist"))).toEqual({
      code: "NOT_FOUND",
      message: "Application not found",
    });

    expect(ApplicationListResponseSchema.parse((await ola.get("/api/v1/applications")).body).data).toEqual([]);
    expect(ApplicationStatsSchema.parse((await ola.get("/api/v1/applications/stats")).body).countsByStage.APPLIED).toBe(0);

    const stillThere = ApplicationWithEventsSchema.parse((await sam.get(`/api/v1/applications/${id}`)).body);
    expect(stillThere).toMatchObject({ stage: "APPLIED", notes: "private" });
    expect(stillThere.events).toHaveLength(1);
  });

  it("requires a signed-in job seeker", async () => {
    await createEmployer(db, "erin@acme.test", "Acme");
    const employer = await signedInAgent(app, "erin@acme.test");
    expect((await request(app).get("/api/v1/applications")).status).toBe(401);
    expect((await employer.get("/api/v1/applications")).status).toBe(403);
    expect((await employer.post("/api/v1/applications").send(external)).status).toBe(403);
  });
});

describe("GET /api/v1/applications/stats", () => {
  it("counts stages and computes the response rate from real requests", async () => {
    const { sam } = await seekers();
    const create = async (stage: string) =>
      ApplicationSchema.parse((await sam.post("/api/v1/applications").send({ ...external, stage })).body);

    await create("SAVED");
    await create("APPLIED");
    const interviewed = await create("APPLIED");
    await sam.patch(`/api/v1/applications/${interviewed.id}`).send({ stage: "INTERVIEW" });
    const rejected = await create("APPLIED");
    await sam.patch(`/api/v1/applications/${rejected.id}`).send({ stage: "REJECTED" });

    const stats = ApplicationStatsSchema.parse((await sam.get("/api/v1/applications/stats")).body);
    expect(stats.countsByStage).toMatchObject({ SAVED: 1, APPLIED: 1, INTERVIEW: 1, REJECTED: 1 });
    // Reached APPLIED: 3. Responded (INTERVIEW, REJECTED): 2.
    expect(stats).toMatchObject({ reachedApplied: 3, responded: 2 });
    expect(stats.responseRate).toBeCloseTo(2 / 3, 10);
    // All three applied today, so the current week (last entry) has 3.
    expect(stats.weekly.at(-1)?.count).toBe(3);
    expect(stats.funnel).toEqual([
      { stage: "SAVED", count: 4 },
      { stage: "APPLIED", count: 3 },
      { stage: "OA", count: 1 },
      { stage: "INTERVIEW", count: 1 },
      { stage: "OFFER", count: 0 },
    ]);
  });
});
