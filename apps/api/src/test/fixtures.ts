import request from "supertest";
import type { Express } from "express";
import type { Db } from "../db";
import type { Prisma } from "../generated/prisma/client";
import { hashPassword } from "../auth/password";

export const TEST_PASSWORD = "correct horse battery";

// bcrypt at cost 12 takes ~300 ms, so fixture users share one hash.
let passwordHash: Promise<string> | undefined;
const fixturePasswordHash = () => (passwordHash ??= hashPassword(TEST_PASSWORD));

export const resetDb = (db: Db) =>
  db.$executeRawUnsafe('TRUNCATE "Application", "Job", "Company", "User" RESTART IDENTITY CASCADE');

export const createCompany = (db: Db, name: string) => db.company.create({ data: { name } });

export type JobOverrides = Partial<Prisma.JobUncheckedCreateInput>;

export const createJob = (db: Db, companyId: string, overrides: JobOverrides = {}) =>
  db.job.create({
    data: {
      title: "Developer",
      description: "Write code.",
      type: "FULL_TIME",
      location: "Fredericton, NB",
      companyId,
      ...overrides,
    },
  });

export const createSeeker = async (db: Db, email: string) =>
  db.user.create({
    data: { email, name: "Sam Seeker", role: "SEEKER", passwordHash: await fixturePasswordHash() },
  });

// An employer together with the company they belong to.
export const createEmployer = async (db: Db, email: string, companyName: string) => {
  const company = await createCompany(db, companyName);
  const user = await db.user.create({
    data: {
      email,
      name: "Erin Employer",
      role: "EMPLOYER",
      companyId: company.id,
      passwordHash: await fixturePasswordHash(),
    },
  });
  return { user, company };
};

// A supertest agent that keeps cookies, signed in as the given user.
export const signedInAgent = async (app: Express, email: string) => {
  const agent = request.agent(app);
  const res = await agent.post("/api/v1/auth/login").send({ email, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login as ${email} failed with ${res.status}: ${JSON.stringify(res.body)}`);
  }
  return agent;
};
