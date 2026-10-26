import request from "supertest";
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest";
import { AuthResponseSchema, ErrorResponseSchema } from "@fredericton-grad-jobs/shared";
import { createPrismaClient } from "../db";
import { SESSION_COOKIE } from "../auth/session";
import { createCompany, createSeeker, resetDb, TEST_PASSWORD } from "../test/fixtures";
import { createTestApp } from "../testApp";

const db = createPrismaClient(inject("databaseUrl"));
const app = createTestApp({ db });

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await resetDb(db);
});

const errorOf = (res: { body: unknown }) => ErrorResponseSchema.parse(res.body).error;

const sessionCookie = (res: { headers: Record<string, unknown> }) => {
  const header = res.headers["set-cookie"];
  const cookies = Array.isArray(header) ? header.map(String) : [];
  return cookies.find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
};

const seekerBody = {
  role: "SEEKER",
  email: "Sam@Example.TEST",
  password: "a long enough password",
  name: "Sam",
};

const employerBody = {
  role: "EMPLOYER",
  email: "erin@acme.test",
  password: "a long enough password",
  name: "Erin",
  company: { name: "Acme", contactEmail: "jobs@acme.test" },
};

describe("POST /api/v1/auth/register", () => {
  it("creates a seeker with a lowercased email, a bcrypt hash and a session cookie", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(seekerBody);
    expect(res.status).toBe(201);
    expect(AuthResponseSchema.parse(res.body).user).toMatchObject({
      email: "sam@example.test",
      name: "Sam",
      role: "SEEKER",
      company: null,
    });
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");

    const cookie = sessionCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    // Secure is only set in production (secureCookies: true).
    expect(cookie).not.toMatch(/Secure/);

    const stored = await db.user.findUniqueOrThrow({ where: { email: "sam@example.test" } });
    expect(stored.passwordHash).toMatch(/^\$2b\$12\$/);
    expect(stored.passwordHash).not.toContain(seekerBody.password);
  });

  it("creates an employer together with a new company", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(employerBody);
    expect(res.status).toBe(201);
    const { user } = AuthResponseSchema.parse(res.body);
    expect(user).toMatchObject({ role: "EMPLOYER", company: { name: "Acme" } });
    expect(await db.company.findFirstOrThrow({ where: { name: "Acme" } })).toMatchObject({
      contactEmail: "jobs@acme.test",
    });
  });

  it("returns 409 for an email that is already registered, in any letter case", async () => {
    expect((await request(app).post("/api/v1/auth/register").send(seekerBody)).status).toBe(201);
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...seekerBody, email: "SAM@example.test" });
    expect(res.status).toBe(409);
    expect(errorOf(res).details).toEqual([
      { path: "email", message: "An account with this email already exists" },
    ]);
  });

  it("returns 409 when an employer registers a company name that is taken", async () => {
    await createCompany(db, "ACME");
    const res = await request(app).post("/api/v1/auth/register").send(employerBody);
    expect(res.status).toBe(409);
    expect(errorOf(res).details).toEqual([
      { path: "company.name", message: "A company with this name is already registered" },
    ]);
    expect(await db.user.count()).toBe(0);
  });

  it("returns 400 for a password shorter than 10 characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...seekerBody, password: "123456789" });
    expect(res.status).toBe(400);
    expect(errorOf(res).details).toEqual([
      { path: "password", message: "Password must be at least 10 characters" },
    ]);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("signs in with the right password and sets the session cookie", async () => {
    await createSeeker(db, "sam@example.test");
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "SAM@example.test", password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(AuthResponseSchema.parse(res.body).user.email).toBe("sam@example.test");
    expect(sessionCookie(res)).toMatch(/HttpOnly/);
  });

  it("returns 401 with the same message for a wrong password and an unknown email", async () => {
    await createSeeker(db, "sam@example.test");
    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "sam@example.test", password: "not the password" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.test", password: TEST_PASSWORD });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(errorOf(res)).toEqual({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      expect(sessionCookie(res)).toBeUndefined();
    }
  });

  it("rate-limits failed attempts per email, across IPs", async () => {
    const limited = createTestApp({
      db,
      loginRateLimit: {
        perIp: { windowMs: 60_000, limit: 100 },
        perEmail: { windowMs: 60_000, limit: 3 },
      },
    });
    await createSeeker(db, "sam@example.test");
    const attempt = (password: string) =>
      request(limited).post("/api/v1/auth/login").send({ email: "Sam@example.test", password });

    for (let i = 0; i < 3; i++) expect((await attempt("wrong password")).status).toBe(401);
    const blocked = await attempt(TEST_PASSWORD);
    expect(blocked.status).toBe(429);
    expect(errorOf(blocked).code).toBe("RATE_LIMITED");
  });

  it("rate-limits all attempts per IP", async () => {
    const limited = createTestApp({
      db,
      loginRateLimit: {
        perIp: { windowMs: 60_000, limit: 2 },
        perEmail: { windowMs: 60_000, limit: 100 },
      },
    });
    const attempt = (email: string) =>
      request(limited).post("/api/v1/auth/login").send({ email, password: "whatever" });
    expect((await attempt("a@example.test")).status).toBe(401);
    expect((await attempt("b@example.test")).status).toBe(401);
    expect((await attempt("c@example.test")).status).toBe(429);
  });
});

describe("GET /api/v1/auth/me and POST /api/v1/auth/logout", () => {
  it("returns 401 without a cookie or with a forged one", async () => {
    const none = await request(app).get("/api/v1/auth/me");
    expect(none.status).toBe(401);
    expect(errorOf(none)).toEqual({ code: "UNAUTHORIZED", message: "Sign in to continue" });

    const forged = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalid`);
    expect(forged.status).toBe(401);
  });

  it("returns the user while signed in and 401 after logout", async () => {
    const agent = request.agent(app);
    expect((await agent.post("/api/v1/auth/register").send(seekerBody)).status).toBe(201);

    const me = await agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    expect(AuthResponseSchema.parse(me.body).user.email).toBe("sam@example.test");

    const logout = await agent.post("/api/v1/auth/logout");
    expect(logout.status).toBe(204);
    expect(sessionCookie(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect((await agent.get("/api/v1/auth/me")).status).toBe(401);
  });
});
