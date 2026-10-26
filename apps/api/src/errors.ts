import type { ErrorCode } from "@fredericton-grad-jobs/shared";

// An error with a known HTTP status, turned into an error response by the
// error middleware.
export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message: string) => new HttpError(404, "NOT_FOUND", message);
