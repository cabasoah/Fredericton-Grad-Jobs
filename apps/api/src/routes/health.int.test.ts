import request from "supertest";
import { afterAll, describe, expect, inject, it } from "vitest";
import { createPrismaClient } from "../db";
import { createTestApp } from "../testApp";

const db = createPrismaClient(inject("databaseUrl"));
// Nothing listens on port 1, so every query fails to connect.
const unreachable = createPrismaClient("postgresql://test:test@localhost:1/test");

afterAll(async () => {
  await db.$disconnect();
  await unreachable.$disconnect();
});

describe("GET /api/v1/health", () => {
  it("returns 200 when the database answers", async () => {
    const res = await request(createTestApp({ db })).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  it("returns 503 when the database is unreachable", async () => {
    const res = await request(createTestApp({ db: unreachable })).get("/api/v1/health");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "error", database: "unreachable" });
  });
});
