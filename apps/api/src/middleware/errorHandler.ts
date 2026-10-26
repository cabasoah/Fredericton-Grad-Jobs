import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import type { ErrorResponse } from "@fredericton-grad-jobs/shared";
import { Prisma } from "../generated/prisma/client";
import { HttpError } from "../errors";

type MappedError = { status: number; body: ErrorResponse };

const response = (
  status: number,
  code: ErrorResponse["error"]["code"],
  message: string,
  details?: unknown,
): MappedError => ({
  status,
  body: { error: details === undefined ? { code, message } : { code, message, details } },
});

// Errors raised by express.json() (body-parser) carry a status and a type.
const isBodyParserError = (err: unknown): err is { status: number; type: string } =>
  typeof err === "object" &&
  err !== null &&
  "type" in err &&
  typeof err.type === "string" &&
  "status" in err &&
  typeof err.status === "number";

export const toErrorResponse = (err: unknown, exposeStack: boolean): MappedError => {
  if (err instanceof HttpError) {
    return response(err.status, err.code, err.message, err.details);
  }
  if (err instanceof ZodError) {
    return response(
      400,
      "VALIDATION_ERROR",
      "Request validation failed",
      err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return response(409, "CONFLICT", "A record with the same unique fields already exists", {
        target: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return response(404, "NOT_FOUND", "Record not found");
    }
  }
  if (isBodyParserError(err)) {
    if (err.type === "entity.parse.failed") {
      return response(400, "BAD_REQUEST", "Malformed JSON body");
    }
    if (err.status >= 400 && err.status < 500) {
      return response(err.status, "BAD_REQUEST", "Invalid request body");
    }
  }
  // Unknown error: never expose internals outside development.
  const stack = err instanceof Error ? err.stack : undefined;
  return response(
    500,
    "INTERNAL_ERROR",
    "Internal server error",
    exposeStack && stack ? { stack } : undefined,
  );
};

export const createErrorHandler =
  ({ exposeStack }: { exposeStack: boolean }): ErrorRequestHandler =>
  (err: unknown, req, res, _next) => {
    const { status, body } = toErrorResponse(err, exposeStack);
    if (status >= 500) {
      req.log.error({ err }, "Unhandled error");
    }
    res.status(status).json(body);
  };
