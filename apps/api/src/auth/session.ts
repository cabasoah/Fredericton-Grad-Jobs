import type { CookieOptions, Response } from "express";
import { jwtVerify, SignJWT } from "jose";

// Sessions are a single signed JWT (HS256) in an httpOnly cookie.
//
// Trade-off: there is no refresh token. The access token simply lives for
// SESSION_TTL_SECONDS and the user logs in again afterwards. That keeps the
// design small (no token table, no rotation), but a JWT cannot be revoked
// before it expires: logging out deletes the cookie in this browser, while a
// stolen token stays valid until expiry. A short lifetime limits that window,
// at the cost of users being signed out every hour. requireAuth also reloads
// the user on every request, so a deleted account loses access immediately.
// If sessions must be revocable (or longer), add refresh tokens stored
// server-side, or switch to database-backed sessions.
//
// CSRF: the cookie is SameSite=Lax, so other sites cannot send it on
// cross-site POST/PATCH/DELETE requests, and CORS only lets the configured
// web origin read responses.
export const SESSION_COOKIE = "access_token";
export const SESSION_TTL_SECONDS = 60 * 60;

export type SessionConfig = {
  secret: string;
  // Secure cookies need HTTPS; enabled in production only.
  secureCookies: boolean;
};

const key = (secret: string) => new TextEncoder().encode(secret);

const cookieOptions = ({ secureCookies }: SessionConfig): CookieOptions => ({
  httpOnly: true,
  secure: secureCookies,
  sameSite: "lax",
  path: "/",
});

export const startSession = async (res: Response, config: SessionConfig, userId: string) => {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key(config.secret));
  res.cookie(SESSION_COOKIE, token, {
    ...cookieOptions(config),
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
};

export const endSession = (res: Response, config: SessionConfig) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions(config));
};

// Returns the user id from a valid, unexpired token, or null.
export const readSession = async (token: unknown, config: SessionConfig) => {
  if (typeof token !== "string" || token === "") return null;
  try {
    const { payload } = await jwtVerify(token, key(config.secret), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
};
