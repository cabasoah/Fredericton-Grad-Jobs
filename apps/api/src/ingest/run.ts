import { randomUUID } from "node:crypto";
import type { Logger } from "pino";
import type { Db } from "../db";
import { DEFAULT_HTTP_OPTIONS, sleep, type HttpOptions } from "./http";
import type { IngestTarget } from "./companies";
import { greenhouse } from "./sources/greenhouse";
import { lever } from "./sources/lever";
import type { IngestSourceName, NormalizedJob, Source } from "./types";

export const DEFAULT_SOURCES: Record<IngestSourceName, Source> = { GREENHOUSE: greenhouse, LEVER: lever };

export type IngestOptions = {
  db: Db;
  logger: Logger;
  targets: IngestTarget[];
  sources?: Record<IngestSourceName, Source>;
  http?: HttpOptions;
  // Pause between companies, to be polite to the job boards.
  delayBetweenCompaniesMs?: number;
};

export type IngestRunSummary = {
  source: IngestSourceName;
  company: string;
  startedAt: Date;
  finishedAt: Date | null;
  fetched: number;
  created: number;
  updated: number;
  closed: number;
  errors: number;
  errorDetail: string | null;
};

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

const changed = (
  existing: Omit<NormalizedJob, "externalId"> & { status: string },
  next: NormalizedJob,
) =>
  existing.status !== "OPEN" ||
  existing.title !== next.title ||
  existing.description !== next.description ||
  existing.location !== next.location ||
  existing.remote !== next.remote ||
  existing.type !== next.type ||
  existing.externalUrl !== next.externalUrl ||
  existing.postedAt.getTime() !== next.postedAt.getTime();

const companyIdFor = async (db: Db, name: string) => {
  const existing = await db.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  return existing?.id ?? (await db.company.create({ data: { name }, select: { id: true } })).id;
};

const ingestCompany = async (
  { db, logger }: IngestOptions,
  source: Source,
  target: IngestTarget,
  http: HttpOptions,
  batchId: string,
): Promise<IngestRunSummary> => {
  const run = await db.ingestRun.create({ data: { batchId, source: source.name, company: target.company } });
  const counts = { fetched: 0, created: 0, updated: 0, closed: 0, errors: 0 };
  const errorDetails: string[] = [];
  const recordError = (detail: string) => {
    counts.errors++;
    errorDetails.push(detail);
  };

  try {
    const rawPostings = await source.fetchJobs(target.company, http);
    counts.fetched = rawPostings.length;

    // Ids of every posting the source still lists, including ones we fail
    // to map, so they are not closed by mistake.
    const liveIds = new Set<string>();
    const postings = new Map<string, NormalizedJob>();
    for (const raw of rawPostings) {
      const id = source.rawId(raw);
      if (id) liveIds.add(id);
      try {
        const job = source.normalize(raw);
        postings.set(job.externalId, job);
      } catch (err) {
        recordError(`Could not map posting ${id ?? "(no id)"}: ${message(err)}`);
      }
    }

    const companyId = await companyIdFor(db, target.name);
    const existing = await db.job.findMany({
      where: { source: source.name, externalId: { in: [...postings.keys()] } },
      select: {
        id: true,
        externalId: true,
        status: true,
        title: true,
        description: true,
        location: true,
        remote: true,
        type: true,
        externalUrl: true,
        postedAt: true,
      },
    });
    const byExternalId = new Map(existing.map((job) => [job.externalId, job]));

    for (const job of postings.values()) {
      const current = byExternalId.get(job.externalId);
      try {
        if (!current) {
          await db.job.create({
            data: { ...job, source: source.name, status: "OPEN", companyId, postedById: null },
          });
          counts.created++;
        } else if (changed({ ...current, externalUrl: current.externalUrl ?? "" }, job)) {
          // Also reopens a posting that was CLOSED and is listed again.
          await db.job.update({ where: { id: current.id }, data: { ...job, status: "OPEN" } });
          counts.updated++;
        }
      } catch (err) {
        recordError(`Could not save posting ${job.externalId}: ${message(err)}`);
      }
    }

    // Postings that disappeared from the source: CLOSED, never deleted.
    const { count } = await db.job.updateMany({
      where: { source: source.name, companyId, status: "OPEN", externalId: { notIn: [...liveIds] } },
      data: { status: "CLOSED" },
    });
    counts.closed = count;
  } catch (err) {
    // A failed fetch closes nothing: an outage must not close every job.
    recordError(message(err));
  }

  // The first error is stored; all of them are logged.
  const errorDetail = errorDetails[0] ?? null;
  const finished = await db.ingestRun.update({
    where: { id: run.id },
    data: { ...counts, errorDetail, finishedAt: new Date() },
  });
  if (errorDetails.length > 1) {
    logger.warn({ batchId, company: target.company, errorDetails }, "ingest errors");
  }
  logger.info(
    { batchId, source: source.name, company: target.company, ...counts },
    `ingest ${source.name.toLowerCase()}/${target.company}: fetched=${counts.fetched} created=${counts.created} updated=${counts.updated} closed=${counts.closed} errors=${counts.errors}${errorDetail ? ` (${errorDetail})` : ""}`,
  );
  return {
    source: source.name,
    company: target.company,
    startedAt: finished.startedAt,
    finishedAt: finished.finishedAt,
    ...counts,
    errorDetail,
  };
};

// Pulls every target once. Each company gets its own IngestRun row; one
// company failing does not stop the others.
export const runIngest = async (options: IngestOptions) => {
  const {
    targets,
    sources = DEFAULT_SOURCES,
    http = DEFAULT_HTTP_OPTIONS,
    delayBetweenCompaniesMs = 1_000,
    logger,
  } = options;
  const batchId = randomUUID();
  const rows: IngestRunSummary[] = [];

  for (const [index, target] of targets.entries()) {
    if (index > 0 && delayBetweenCompaniesMs > 0) await sleep(delayBetweenCompaniesMs);
    rows.push(await ingestCompany(options, sources[target.source], target, http, batchId));
  }

  const total = (key: "fetched" | "created" | "updated" | "closed" | "errors") =>
    rows.reduce((sum, row) => sum + row[key], 0);
  logger.info(
    { batchId, companies: rows.length },
    `ingest finished: companies=${rows.length} fetched=${total("fetched")} created=${total("created")} updated=${total("updated")} closed=${total("closed")} errors=${total("errors")}`,
  );
  return { batchId, rows };
};
