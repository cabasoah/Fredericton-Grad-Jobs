import { Router, type RequestHandler } from "express";
import { LoginSchema, RegisterSchema } from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";
import { HttpError } from "../errors";
import { currentUser, requireAuth, toPublicUser, userSelect, type AuthUser } from "../auth/middleware";
import { hashPassword, verifyPassword } from "../auth/password";
import { endSession, startSession, type SessionConfig } from "../auth/session";

export const authRouter = (db: Db, session: SessionConfig, loginLimiters: RequestHandler[]) => {
  const router = Router();

  router.post("/register", async (req, res) => {
    const body = RegisterSchema.parse(req.body);
    // Hash before opening the transaction: it takes ~300 ms.
    const passwordHash = await hashPassword(body.password);

    const user: AuthUser = await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: body.email }, select: { id: true } });
      if (existing) {
        throw new HttpError(409, "CONFLICT", "An account with this email already exists", [
          { path: "email", message: "An account with this email already exists" },
        ]);
      }

      let companyId: string | null = null;
      if (body.role === "EMPLOYER") {
        // Employers create a new company. Joining an existing one would let
        // anyone post as any company, so a taken name is rejected.
        const taken = await tx.company.findFirst({
          where: { name: { equals: body.company.name, mode: "insensitive" } },
          select: { id: true },
        });
        if (taken) {
          throw new HttpError(409, "CONFLICT", "A company with this name is already registered", [
            { path: "company.name", message: "A company with this name is already registered" },
          ]);
        }
        companyId = (await tx.company.create({ data: body.company, select: { id: true } })).id;
      }

      return tx.user.create({
        data: { email: body.email, name: body.name, role: body.role, passwordHash, companyId },
        select: userSelect,
      });
    });

    await startSession(res, session, user.id);
    res.status(201).json({ user: toPublicUser(user) });
  });

  router.post("/login", ...loginLimiters, async (req, res) => {
    const { email, password } = LoginSchema.parse(req.body);
    const found = await db.user.findUnique({
      where: { email },
      select: { ...userSelect, passwordHash: true },
    });
    // Same message and (thanks to the dummy hash) similar timing whether the
    // email is unknown or the password is wrong.
    const valid = await verifyPassword(password, found?.passwordHash ?? null);
    if (!found || !valid) {
      throw new HttpError(401, "UNAUTHORIZED", "Invalid email or password");
    }
    const { passwordHash: _passwordHash, ...user } = found;
    await startSession(res, session, user.id);
    res.json({ user: toPublicUser(user) });
  });

  // Always succeeds, so a stale or missing cookie still "logs out".
  router.post("/logout", (_req, res) => {
    endSession(res, session);
    res.status(204).end();
  });

  router.get("/me", requireAuth(db, session), (req, res) => {
    const user = currentUser(req);
    res.json({ user: toPublicUser(user) });
  });

  return router;
};
