import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema } from "./auth";

const seeker = {
  role: "SEEKER",
  email: "  Ada@Example.COM ",
  password: "correct horse",
  name: "Ada",
};

describe("RegisterSchema", () => {
  it("trims and lowercases the email", () => {
    expect(RegisterSchema.parse(seeker).email).toBe("ada@example.com");
  });

  it("requires a password of at least 10 characters and at most 72 bytes", () => {
    expect(RegisterSchema.safeParse({ ...seeker, password: "123456789" }).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...seeker, password: "a".repeat(72) }).success).toBe(true);
    expect(RegisterSchema.safeParse({ ...seeker, password: "a".repeat(73) }).success).toBe(false);
    // 3 bytes per character in UTF-8: 25 characters = 75 bytes.
    expect(RegisterSchema.safeParse({ ...seeker, password: "€".repeat(25) }).success).toBe(false);
  });

  it("requires company details for employers only", () => {
    const employer = { ...seeker, role: "EMPLOYER" };
    expect(RegisterSchema.safeParse(employer).success).toBe(false);
    expect(RegisterSchema.safeParse({ ...employer, company: { name: "Acme" } }).success).toBe(true);
    expect(RegisterSchema.safeParse({ ...seeker, company: { name: "Acme" } }).success).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(RegisterSchema.safeParse({ ...seeker, role: "ADMIN" }).success).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("normalises the email and does not apply password length rules", () => {
    expect(LoginSchema.parse({ email: "ADA@example.com", password: "short" })).toEqual({
      email: "ada@example.com",
      password: "short",
    });
  });
});
