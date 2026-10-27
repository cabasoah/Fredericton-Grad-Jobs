import {
  ApplicationCreateSchema,
  ApplicationListResponseSchema,
  ApplicationSchema,
  ApplicationStatsSchema,
  ApplicationUpdateSchema,
  ApplicationWithEventsSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
  JobCreateSchema,
  JobListResponseSchema,
  JobSchema,
  JobUpdateSchema,
  LoginSchema,
  RegisterSchema,
  StatsSchema,
  type ApplicationCreateInput,
  type ApplicationUpdate,
  type JobCreateInput,
  type JobSort,
  type JobType,
  type JobUpdate,
  type LoginInput,
  type RegisterInput,
  type RemoteType,
} from "@fredericton-grad-jobs/shared";
import { ZodError } from "zod";
import { API_URL } from "@/config";

// A non-2xx response from the API, with the message and details from its
// { error: { code, message, details? } } body when present.
export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const toApiError = async (res: Response): Promise<ApiError> => {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }
  const parsed = ErrorResponseSchema.safeParse(body);
  return parsed.success
    ? new ApiError(res.status, parsed.data.error.message, parsed.data.error.details)
    : new ApiError(res.status, `Request failed with status ${res.status}`);
};

// Fetches an API path (e.g. "/jobs") and returns the parsed JSON body, or
// undefined for 204 responses. Throws ApiError for non-2xx responses.
// credentials: "include" sends the httpOnly session cookie to the API.
export const apiFetch = async (path: string, init?: RequestInit): Promise<unknown> => {
  const res = await fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined;
  const body: unknown = await res.json();
  return body;
};

export const jsonRequest = (method: "POST" | "PATCH", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Filters for GET /jobs, as the UI holds them (all optional).
export type JobFilters = {
  q?: string;
  type?: JobType;
  remote?: RemoteType;
  location?: string;
  salaryMin?: number;
  tags?: string[];
  sort?: JobSort;
};

export const jobListSearch = (filters: JobFilters, limit: number, cursor?: string) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.remote) params.set("remote", filters.remote);
  if (filters.location) params.set("location", filters.location);
  if (filters.salaryMin !== undefined) params.set("salaryMin", String(filters.salaryMin));
  if (filters.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters.sort) params.set("sort", filters.sort);
  if (cursor) params.set("cursor", cursor);
  return params.toString();
};

const jobPath = (id: string) => `/jobs/${encodeURIComponent(id)}`;

// Typed API client: every request body is validated with the shared schema
// before sending, and every response is validated before it is returned.
export const api = {
  listJobs: async (filters: JobFilters, limit: number, cursor?: string) =>
    JobListResponseSchema.parse(await apiFetch(`/jobs?${jobListSearch(filters, limit, cursor)}`)),
  getJob: async (id: string) => JobSchema.parse(await apiFetch(jobPath(id))),
  createJob: async (input: JobCreateInput) =>
    JobSchema.parse(await apiFetch("/jobs", jsonRequest("POST", JobCreateSchema.parse(input)))),
  updateJob: async (id: string, input: JobUpdate) =>
    JobSchema.parse(await apiFetch(jobPath(id), jsonRequest("PATCH", JobUpdateSchema.parse(input)))),
  deleteJob: async (id: string) => {
    await apiFetch(jobPath(id), { method: "DELETE" });
  },

  getStats: async () => StatsSchema.parse(await apiFetch("/stats")),

  listApplications: async () =>
    ApplicationListResponseSchema.parse(await apiFetch("/applications")).data,
  getApplication: async (id: string) =>
    ApplicationWithEventsSchema.parse(await apiFetch(`/applications/${encodeURIComponent(id)}`)),
  createApplication: async (input: ApplicationCreateInput) =>
    ApplicationSchema.parse(
      await apiFetch("/applications", jsonRequest("POST", ApplicationCreateSchema.parse(input))),
    ),
  updateApplication: async (id: string, input: ApplicationUpdate) =>
    ApplicationWithEventsSchema.parse(
      await apiFetch(
        `/applications/${encodeURIComponent(id)}`,
        jsonRequest("PATCH", ApplicationUpdateSchema.parse(input)),
      ),
    ),
  deleteApplication: async (id: string) => {
    await apiFetch(`/applications/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  getApplicationStats: async () =>
    ApplicationStatsSchema.parse(await apiFetch("/applications/stats")),

  me: async () => AuthResponseSchema.parse(await apiFetch("/auth/me")).user,
  login: async (input: LoginInput) =>
    AuthResponseSchema.parse(await apiFetch("/auth/login", jsonRequest("POST", LoginSchema.parse(input)))).user,
  register: async (input: RegisterInput) =>
    AuthResponseSchema.parse(
      await apiFetch("/auth/register", jsonRequest("POST", RegisterSchema.parse(input))),
    ).user,
  logout: async () => {
    await apiFetch("/auth/logout", { method: "POST" });
  },
};

// Turns a failed save into a message plus per-field details for the form.
// Handles client-side Zod validation errors and API errors.
export const describeError = (err: unknown): { message: string; details: string[] } => {
  const issueText = (path: unknown, message: unknown) =>
    `${typeof path === "string" && path ? `${path}: ` : ""}${String(message)}`;

  if (err instanceof ZodError) {
    return {
      message: "Please fix the following:",
      details: err.issues.map((issue) => issueText(issue.path.join("."), issue.message)),
    };
  }
  if (err instanceof ApiError) {
    const details = Array.isArray(err.details)
      ? err.details.map((detail: unknown) =>
          typeof detail === "object" && detail !== null && "message" in detail
            ? issueText("path" in detail ? detail.path : "", detail.message)
            : String(detail),
        )
      : [];
    return { message: err.message, details };
  }
  return { message: "Could not save the job. Please try again.", details: [] };
};
