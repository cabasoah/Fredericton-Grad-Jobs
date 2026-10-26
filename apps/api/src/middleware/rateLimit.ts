import { rateLimit } from "express-rate-limit";
import { HttpError } from "../errors";

export type RateLimitOptions = {
  windowMs: number;
  limit: number;
};

export const DEFAULT_WRITE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  limit: 60,
};

// Applied to POST/PATCH/DELETE routes only. Responds through the error
// middleware so the body has the usual { error } shape.
export const createWriteRateLimiter = ({ windowMs, limit }: RateLimitOptions) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new HttpError(429, "RATE_LIMITED", "Too many write requests, please try again later"));
    },
  });

export type LoginRateLimitOptions = {
  // All login attempts from one IP address.
  perIp: RateLimitOptions;
  // Failed login attempts for one email address, from any IP.
  perEmail: RateLimitOptions;
};

export const DEFAULT_LOGIN_RATE_LIMIT: LoginRateLimitOptions = {
  perIp: { windowMs: 15 * 60 * 1000, limit: 20 },
  perEmail: { windowMs: 15 * 60 * 1000, limit: 5 },
};

const tooManyLogins = () =>
  new HttpError(429, "RATE_LIMITED", "Too many login attempts, please try again later");

// The email from the (already JSON-parsed) body, normalised like LoginSchema.
const loginEmailKey = (body: unknown) => {
  const email =
    typeof body === "object" && body !== null && "email" in body && typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  return `login-email:${email}`;
};

// Two limiters for POST /auth/login: per IP (slows one client guessing many
// accounts) and per email (slows many clients guessing one account). The
// per-email limiter only counts failed attempts, so signing in successfully
// does not use up the allowance.
export const createLoginRateLimiters = ({ perIp, perEmail }: LoginRateLimitOptions) => [
  rateLimit({
    ...perIp,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, _res, next) => next(tooManyLogins()),
  }),
  rateLimit({
    ...perEmail,
    standardHeaders: false,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => loginEmailKey(req.body),
    handler: (_req, _res, next) => next(tooManyLogins()),
  }),
];
