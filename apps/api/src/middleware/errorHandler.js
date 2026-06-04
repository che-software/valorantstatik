/**
 * @file errorHandler.js
 * @description Centralised Express error-handling middleware.
 *
 * Must be registered LAST in the middleware chain (after all routes) so that
 * errors propagated via next(err) are caught here.
 *
 * Produces a consistent JSON error envelope:
 * {
 *   "error":      "Human-readable message",
 *   "status":     404,
 *   "retryAfter": 90    // only present on 429 responses
 * }
 */

import { ApiError } from "../controllers/riotApiClient.js";
import { env } from "../config/env.js";

/**
 * @type {import("express").ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Known, typed API errors — translate directly to HTTP responses.
  if (err instanceof ApiError) {
    const body = { error: err.message, status: err.status };
    if (err.retryAfter !== undefined) body.retryAfter = err.retryAfter;

    return res.status(err.status).json(body);
  }

  // Mongoose validation errors.
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(", "), status: 400 });
  }

  // Mongoose cast errors (e.g. invalid ObjectId in a query).
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format.", status: 400 });
  }

  // Unknown / unexpected errors — log the full stack in development.
  console.error("[ErrorHandler] Unhandled error:", err);

  // Never leak internal stack traces in production.
  const message = env.isDev ? err.message : "An unexpected error occurred.";

  return res.status(500).json({ error: message, status: 500 });
}
