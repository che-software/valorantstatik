/**
 * @file app.js
 * @description Express application factory.
 *
 * Separating app creation from server startup (server.js) makes the app
 * importable in integration tests without binding to a port.
 */

import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import morgan  from "morgan";

import { env }           from "./config/env.js";
import { globalLimiter, searchLimiter } from "./middleware/rateLimiter.js";
import { errorHandler }  from "./middleware/errorHandler.js";

import playerRoutes      from "./routes/playerRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import healthRoutes      from "./routes/healthRoutes.js";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
// helmet sets a sensible collection of HTTP security headers (CSP, HSTS, etc.).
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header) and listed origins.
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" is not allowed.`));
      }
    },
    methods:     ["GET"],
    credentials: false,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));

// ── Request logging ───────────────────────────────────────────────────────────
// "dev" format in development, "combined" (Apache-style) in production.
app.use(morgan(env.isDev ? "dev" : "combined"));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/health",             healthRoutes);

// Apply the tighter search limiter only to player endpoints.
app.use("/api/v1/players",     searchLimiter, playerRoutes);
app.use("/api/v1/leaderboard", leaderboardRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found.", status: 404 });
});

// ── Centralised error handler ─────────────────────────────────────────────────
// Must be registered after all routes.
app.use(errorHandler);

export default app;
