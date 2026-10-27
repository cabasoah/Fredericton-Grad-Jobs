import { describe, expect, it } from "vitest";
import { parseEnv, secureCookies } from "./env";

const base = {
  DATABASE_URL: "postgresql://jobs:jobs@localhost:5433/jobs",
  CORS_ORIGIN: "http://localhost:3000, http://localhost:3001",
  JWT_SECRET: "dev-only-insecure-jwt-secret-change-me-0000",
};

describe("secureCookies", () => {
  it("defaults to Secure cookies in production only, and COOKIE_SECURE overrides it", () => {
    expect(secureCookies(parseEnv(base))).toBe(false);
    expect(secureCookies(parseEnv({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(64) }))).toBe(true);
    expect(
      secureCookies(parseEnv({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(64), COOKIE_SECURE: "false" })),
    ).toBe(false);
  });
});

describe("parseEnv", () => {
  it("applies defaults and splits CORS_ORIGIN", () => {
    expect(parseEnv(base)).toMatchObject({
      NODE_ENV: "development",
      PORT: 4000,
      TRUST_PROXY: 0,
      CORS_ORIGIN: ["http://localhost:3000", "http://localhost:3001"],
    });
  });

  it("requires a JWT_SECRET of at least 32 characters", () => {
    expect(() => parseEnv({ ...base, JWT_SECRET: "too-short" })).toThrow(/at least 32 characters/);
  });

  it("refuses the example JWT_SECRET in production only", () => {
    expect(() => parseEnv({ ...base, NODE_ENV: "production" })).toThrow(/Replace the example JWT_SECRET/);
    expect(parseEnv({ ...base, NODE_ENV: "production", JWT_SECRET: "x".repeat(64) }).NODE_ENV).toBe(
      "production",
    );
  });
});
