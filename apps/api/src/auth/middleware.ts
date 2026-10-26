import type { Request, RequestHandler } from "express";
import type { User, UserRole } from "@fredericton-grad-jobs/shared";
import type { Db } from "../db";
import { HttpError } from "../errors";
import { readSession, SESSION_COOKIE, type SessionConfig } from "./session";

export type AuthUser = User & { companyId: string | null };

declare module "express-serve-static-core" {
  interface Request {
    // Set by requireAuth.
    user?: AuthUser;
  }
}

export const unauthorized = () => new HttpError(401, "UNAUTHORIZED", "Sign in to continue");

export const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  companyId: true,
  company: { select: { id: true, name: true } },
} as const;

// Loads the signed-in user from the session cookie, or null.
export const loadSessionUser = async (
  db: Db,
  config: SessionConfig,
  req: Request,
): Promise<AuthUser | null> => {
  const cookies: Record<string, unknown> = req.cookies ?? {};
  const userId = await readSession(cookies[SESSION_COOKIE], config);
  if (!userId) return null;
  // Reloaded on every request, so role or account changes apply at once.
  return db.user.findUnique({ where: { id: userId }, select: userSelect });
};

export const requireAuth =
  (db: Db, config: SessionConfig): RequestHandler =>
  async (req, _res, next) => {
    const user = await loadSessionUser(db, config, req);
    if (!user) throw unauthorized();
    req.user = user;
    next();
  };

// Use after requireAuth.
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "FORBIDDEN", "Your account type cannot do this");
    }
    next();
  };

// For handlers behind requireAuth: the signed-in user, typed as present.
export const currentUser = (req: Request): AuthUser => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const toPublicUser = ({ companyId: _companyId, ...user }: AuthUser): User => user;
