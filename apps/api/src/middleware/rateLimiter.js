/**
 * @file rateLimiter.js
 * @description Express rate-limiting middleware built on express-rate-limit.
 *
 * Two tiers:
 *   - globalLimiter:  Applied to every route — a generous ceiling to prevent
 *                     outright abuse without impacting normal use.
 *   - searchLimiter:  Applied only to the player search endpoints — tighter
 *                     limit because each search triggers an upstream API call
 *                     and we want to stay within HenrikDev's quota.
 */

import rateLimit from "express-rate-limit";

/** Shared options for a clean JSON error response. */
const baseOptions = {
  standardHeaders: true,   // Return X-RateLimit-* headers on every response.
  legacyHeaders:   false,  // Do not emit the deprecated X-RateLimit-* v6 headers.

  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json({
      error:       "Too many requests. Please slow down.",
      status:      options.statusCode,
      retryAfter:  Math.ceil(options.windowMs / 1000),
    });
  },
};

/**
 * Global limiter — 200 requests per minute per IP.
 * Applied in app.js before all routes.
 */
export const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1_000,  // 1 minute window
  max:      200,
  message:  "Global rate limit reached.",
});

/**
 * Search limiter — 30 requests per minute per IP.
 * Applied directly to the player search routes.
 */
export const searchLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1_000,
  max:      30,
  message:  "Search rate limit reached. Please wait before searching again.",
});
