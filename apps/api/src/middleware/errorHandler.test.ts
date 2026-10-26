import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HttpError } from "../errors";
import { createTestApp } from "../testApp";
import { toErrorResponse } from "./errorHandler";

describe("toErrorResponse", () => {
  it("maps HttpError to its status and code", () => {
    expect(toErrorResponse(new HttpError(404, "NOT_FOUND", "Job not found"), false)).toEqual({
      status: 404,
      body: { error: { code: "NOT_FOUND", message: "Job not found" } },
    });
  });

  it("maps ZodError to 400 with issue details", () => {
    const result = z.object({ title: z.string() }).safeParse({});
    const mapped = toErrorResponse(result.error, false);
    expect(mapped.status).toBe(400);
    expect(mapped.body.error.code).toBe("VALIDATION_ERROR");
    expect(mapped.body.error.details).toEqual([
      { path: "title", message: expect.any(String) as unknown },
    ]);
  });

  it("hides the stack of unknown errors unless exposeStack is set", () => {
    const err = new Error("database password is hunter2");
    expect(toErrorResponse(err, false)).toEqual({
      status: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    });
    expect(toErrorResponse(err, true).body.error.details).toEqual({ stack: err.stack });
  });
});

describe("error middleware", () => {
  const app = createTestApp();

  it("returns 404 in the error shape for unknown routes", async () => {
    const res = await request(app).get("/api/v1/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "Route GET /api/v1/nope not found" },
    });
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await request(app)
      .post("/api/v1/nope")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: "BAD_REQUEST", message: "Malformed JSON body" } });
  });

  it("sets security headers and restricts CORS to the configured origin", async () => {
    const allowed = await request(app).get("/api/v1/nope").set("Origin", "http://localhost:3000");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(allowed.headers["x-content-type-options"]).toBe("nosniff");

    const other = await request(app).get("/api/v1/nope").set("Origin", "http://evil.example");
    expect(other.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
