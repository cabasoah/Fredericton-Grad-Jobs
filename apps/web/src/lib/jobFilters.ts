import { JobSortSchema, JobTypeSchema, RemoteTypeSchema } from "@fredericton-grad-jobs/shared";
import type { JobFilters } from "./api";

// Text filters are written to the URL as the user types (debounced); these
// are their URL parameter names.
export const TEXT_FILTER_KEYS = ["q", "location", "salaryMin", "tags"] as const;
export type TextFilterKey = (typeof TEXT_FILTER_KEYS)[number];

const text = (value: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const parseTags = (value: string | null) => {
  const tags = (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
};

const parseSalary = (value: string | null) => {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : undefined;
};

// Reads filters from the URL. Invalid values (e.g. ?type=FOO, ?salaryMin=abc)
// are ignored, so a hand-edited or outdated link still shows results.
export const filtersFromSearchParams = (params: URLSearchParams): JobFilters => {
  const filters: JobFilters = {};
  const q = text(params.get("q"));
  if (q) filters.q = q;
  const type = JobTypeSchema.safeParse(params.get("type"));
  if (type.success) filters.type = type.data;
  const remote = RemoteTypeSchema.safeParse(params.get("remote"));
  if (remote.success) filters.remote = remote.data;
  const location = text(params.get("location"));
  if (location) filters.location = location;
  const salaryMin = parseSalary(params.get("salaryMin"));
  if (salaryMin !== undefined) filters.salaryMin = salaryMin;
  const tags = parseTags(params.get("tags"));
  if (tags) filters.tags = tags;
  const sort = JobSortSchema.safeParse(params.get("sort"));
  if (sort.success && sort.data !== "newest") filters.sort = sort.data;
  return filters;
};

// Writes filters to URL parameters, leaving out empty values and defaults so
// links stay short.
export const filtersToSearchParams = (filters: JobFilters) => {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.remote) params.set("remote", filters.remote);
  if (filters.location) params.set("location", filters.location);
  if (filters.salaryMin !== undefined) params.set("salaryMin", String(filters.salaryMin));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
  return params;
};

// True when anything other than the sort order narrows the results.
export const hasActiveFilters = ({ sort: _sort, ...filters }: JobFilters) =>
  Object.values(filters).some((value) => value !== undefined);
