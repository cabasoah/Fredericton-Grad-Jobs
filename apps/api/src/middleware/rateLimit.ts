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
