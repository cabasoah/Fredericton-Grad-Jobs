import { ErrorResponseSchema } from "@fredericton-grad-jobs/shared";
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
export const apiFetch = async (path: string, init?: RequestInit): Promise<unknown> => {
  const res = await fetch(`${API_URL}${path}`, init);
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
