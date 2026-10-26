import { readFileSync } from "node:fs";
import request from "supertest";
import { pino } from "pino";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { StatsSchema } from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../db";
import { resetDb } from "../test/fixtures";
import { createTestApp } from "../testApp";
import type { IngestTarget } from "./companies";
import { runIngest } from "./run";
import { greenhouse } from "./sources/greenhouse";
import { lever } from "./sources/lever";
import type { Source } from "./types";

const db = createPrismaClient(inject("databaseUrl"));
const logger = pino({ level: "silent" });

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDb(db);
});

// Real responses saved on 2026-10-26 (see normalize.test.ts).
const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8"));
const greenhouseJobs = (fixture("greenhouse.json") as { jobs: unknown[] }).jobs;
const leverPostings = fixture("lever.json") as unknown[];

// The real sources with the network call replaced by fixture data.
const withPostings = (source: Source, postings: () => unknown[]): Source => ({
  ...source,
  fetchJobs: () => Promise.resolve(postings()),
});

const targets: IngestTarget[] = [
  { source: "GREENHOUSE", company: "fixture-board", name: "Fixture Greenhouse Co" },
  { source: "LEVER", company: "fixture-lever", name: "Fixture Lever Co" },
];

const ingest = (ghPostings: unknown[] = greenhouseJobs, lvPostings: unknown[] = leverPostings) =>
  runIngest({
    db,
    logger,
    targets,
    delayBetweenCompaniesMs: 0,
    sources: {
      GREENHOUSE: withPostings(greenhouse, () => ghPostings),
      LEVER: withPostings(lever, () => lvPostings),
    },
  });

const counts = (rows: Awaited<ReturnType<typeof ingest>>["rows"]) =>
  rows.map(({ source, fetched, created, updated, closed, errors }) => ({ source, fetched, created, updated, closed, errors }));

describe("runIngest", () => {
  it("creates jobs on the first run and no duplicates on a second run", async () => {
    const first = await ingest();
    expect(counts(first.rows)).toEqual([
      { source: "GREENHOUSE", fetched: 4, created: 4, updated: 0, closed: 0, errors: 0 },
      { source: "LEVER", fetched: 3, created: 3, updated: 0, closed: 0, errors: 0 },
    ]);

    const second = await ingest();
    expect(counts(second.rows)).toEqual([
      { source: "GREENHOUSE", fetched: 4, created: 0, updated: 0, closed: 0, errors: 0 },
      { source: "LEVER", fetched: 3, created: 0, updated: 0, closed: 0, errors: 0 },
    ]);

    expect(await db.job.count()).toBe(7);
    expect(await db.job.count({ where: { status: "OPEN", postedById: null } })).toBe(7);
    // One company per target, reused on the second run.
    expect(await db.company.count()).toBe(2);
    // One IngestRun row per company per run, all finished.
    expect(await db.ingestRun.count({ where: { finishedAt: { not: null } } })).toBe(4);
    expect(new Set((await db.ingestRun.findMany()).map((run) => run.batchId)).size).toBe(2);
  });

  it("marks postings that disappear as CLOSED and reopens them when they return", async () => {
    await ingest();
    const removedId = "8221711";

    const withoutOne = await ingest(greenhouseJobs.slice(1));
    expect(withoutOne.rows[0]).toMatchObject({ fetched: 3, created: 0, updated: 0, closed: 1 });
    expect(await db.job.findFirst({ where: { externalId: removedId } })).toMatchObject({ status: "CLOSED" });
    // Closed, not deleted.
    expect(await db.job.count()).toBe(7);

    const back = await ingest();
    expect(back.rows[0]).toMatchObject({ created: 0, updated: 1, closed: 0 });
    expect(await db.job.findFirst({ where: { externalId: removedId } })).toMatchObject({ status: "OPEN" });
  });

  it("counts an update only when a field actually changed", async () => {
    await ingest();
    const edited = structuredClone(leverPostings) as { text: string }[];
    const [firstPosting] = edited;
    if (!firstPosting) throw new Error("fixture is empty");
    firstPosting.text = "Accounting Manager (Remote OK)";
    const run = await ingest(greenhouseJobs, edited);
    expect(run.rows[1]).toMatchObject({ created: 0, updated: 1, closed: 0 });
    expect(await db.job.findFirst({ where: { externalId: "e574446e-9c0c-48b7-8c90-4c70df257a71" } })).toMatchObject({
      title: "Accounting Manager (Remote OK)",
    });
  });

  it("closes nothing when the fetch fails, and records the error", async () => {
    await ingest();
    const failing = await runIngest({
      db,
      logger,
      targets: [targets[0] as IngestTarget],
      delayBetweenCompaniesMs: 0,
      sources: {
        GREENHOUSE: { ...greenhouse, fetchJobs: () => Promise.reject(new Error("GET ... returned 503")) },
        LEVER: lever,
      },
    });
    expect(failing.rows[0]).toMatchObject({ fetched: 0, closed: 0, errors: 1, errorDetail: "GET ... returned 503" });
    expect(await db.job.count({ where: { status: "OPEN" } })).toBe(7);
  });

  it("keeps a posting open when it is still listed but cannot be mapped", async () => {
    await ingest();
    const broken = greenhouseJobs.map((job, index) =>
      index === 0 ? { ...(job as Record<string, unknown>), absolute_url: "not a url" } : job,
    );
    const run = await ingest(broken);
    expect(run.rows[0]).toMatchObject({ fetched: 4, created: 0, updated: 0, closed: 0, errors: 1 });
    expect(run.rows[0]?.errorDetail).toMatch(/^Could not map posting 8221711/);
    expect(await db.job.findFirst({ where: { externalId: "8221711" } })).toMatchObject({ status: "OPEN" });
  });
});

describe("GET /api/v1/stats", () => {
  it("returns open jobs per source and the last successful run time", async () => {
    const app = createTestApp({ db });
    const empty = StatsSchema.parse((await request(app).get("/api/v1/stats")).body);
    expect(empty).toEqual({
      openJobs: 0,
      openJobsBySource: { MANUAL: 0, GREENHOUSE: 0, LEVER: 0 },
      lastSuccessfulIngestAt: null,
    });

    await ingest(greenhouseJobs.slice(1));
    const res = await request(app).get("/api/v1/stats");
    expect(res.status).toBe(200);
    const stats = StatsSchema.parse(res.body);
    expect(stats).toMatchObject({ openJobs: 6, openJobsBySource: { MANUAL: 0, GREENHOUSE: 3, LEVER: 3 } });
    const lastRun = await db.ingestRun.findFirst({ orderBy: { finishedAt: "desc" } });
    expect(stats.lastSuccessfulIngestAt).toBe(lastRun?.finishedAt?.toISOString());
  });
});
