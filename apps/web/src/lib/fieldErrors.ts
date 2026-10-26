import { ApiError } from "./api";

export type FieldError = { path: string; message: string };

// Field-level problems from an API error's details, e.g.
// [{ path: "email", message: "An account with this email already exists" }].
export const apiFieldErrors = (err: unknown): FieldError[] => {
  if (!(err instanceof ApiError) || !Array.isArray(err.details)) return [];
  return err.details.flatMap((detail: unknown) =>
    typeof detail === "object" &&
    detail !== null &&
    "path" in detail &&
    typeof detail.path === "string" &&
    "message" in detail &&
    typeof detail.message === "string"
      ? [{ path: detail.path, message: detail.message }]
      : [],
  );
};

// Narrows an API path to one of the form's field names.
export const isFieldOf = <T extends string>(fields: readonly T[], path: string): path is T =>
  fields.some((field) => field === path);
