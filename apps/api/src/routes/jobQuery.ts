import { z } from "zod";
import type { JobListQuery, JobSort } from "@fredericton-grad-jobs/shared/api";
import type { Prisma } from "../generated/prisma/client";
import { HttpError } from "../errors";

// Keyset pagination. Every sort has a total order ending in id, and the cursor
// stores the sort value and id of the last job on the previous page. Nullable
// salary columns sort last, which Prisma's built-in cursor option does not
// handle (NULL comparisons drop rows), so the conditions are built here.

type SortableJob = { id: string; postedAt: Date; salaryMin: number | null; salaryMax: number | null };

const CursorSchema = z.object({
  sort: z.enum(["newest", "salary_desc", "salary_asc"]),
  value: z.union([z.string(), z.number(), z.null()]),
  id: z.string(),
});

type Cursor = z.infer<typeof CursorSchema>;

const sortValue = (sort: JobSort, job: SortableJob): Cursor["value"] => {
  switch (sort) {
    case "newest":
      return job.postedAt.toISOString();
    case "salary_desc":
      return job.salaryMax;
    case "salary_asc":
      return job.salaryMin;
  }
};

export const encodeCursor = (sort: JobSort, job: SortableJob) =>
  Buffer.from(JSON.stringify({ sort, value: sortValue(sort, job), id: job.id })).toString(
    "base64url",
  );

const invalidCursor = () =>
  new HttpError(400, "VALIDATION_ERROR", "Invalid cursor", [
    { path: "cursor", message: "Use the nextCursor value from a previous response with the same sort" },
  ]);

export const decodeCursor = (raw: string, sort: JobSort): Cursor => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    throw invalidCursor();
  }
  const result = CursorSchema.safeParse(parsed);
  if (!result.success || result.data.sort !== sort) {
    throw invalidCursor();
  }
  const { value } = result.data;
  const valueMatchesSort =
    sort === "newest"
      ? typeof value === "string" && !Number.isNaN(Date.parse(value))
      : value === null || typeof value === "number";
  if (!valueMatchesSort) {
    throw invalidCursor();
  }
  return result.data;
};

export const orderByFor = (sort: JobSort): Prisma.JobOrderByWithRelationInput[] => {
  switch (sort) {
    case "newest":
      return [{ postedAt: "desc" }, { id: "desc" }];
    case "salary_desc":
      return [{ salaryMax: { sort: "desc", nulls: "last" } }, { id: "desc" }];
    case "salary_asc":
      return [{ salaryMin: { sort: "asc", nulls: "last" } }, { id: "asc" }];
  }
};

// Rows that come strictly after the cursor in the given sort order.
const afterCursor = ({ sort, value, id }: Cursor): Prisma.JobWhereInput => {
  if (sort === "newest") {
    const postedAt = new Date(value as string);
    return { OR: [{ postedAt: { lt: postedAt } }, { postedAt, id: { lt: id } }] };
  }
  const field = sort === "salary_desc" ? "salaryMax" : "salaryMin";
  const idAfter = sort === "salary_desc" ? { lt: id } : { gt: id };
  if (value === null) {
    // Already in the trailing NULL group: only later ids remain.
    return { [field]: null, id: idAfter };
  }
  const beyond = sort === "salary_desc" ? { lt: value as number } : { gt: value as number };
  return {
    OR: [{ [field]: beyond }, { [field]: value, id: idAfter }, { [field]: null }],
  };
};

export const whereFor = (query: JobListQuery): Prisma.JobWhereInput => {
  const and: Prisma.JobWhereInput[] = [{ status: query.status }];

  if (query.q) {
    const contains = { contains: query.q, mode: "insensitive" } as const;
    and.push({
      OR: [{ title: contains }, { description: contains }, { company: { name: contains } }],
    });
  }
  if (query.type) and.push({ type: query.type });
  if (query.remote) and.push({ remote: query.remote });
  if (query.location) {
    and.push({ location: { contains: query.location, mode: "insensitive" } });
  }
  if (query.tags) and.push({ tags: { hasEvery: query.tags } });
  if (query.salaryMin !== undefined) {
    // Pays at least salaryMin: compare against the top of the range, or the
    // bottom when no maximum is given. Jobs without any salary are excluded.
    and.push({
      OR: [
        { salaryMax: { gte: query.salaryMin } },
        { salaryMax: null, salaryMin: { gte: query.salaryMin } },
      ],
    });
  }
  if (query.cursor) {
    and.push(afterCursor(decodeCursor(query.cursor, query.sort)));
  }
  return { AND: and };
};
