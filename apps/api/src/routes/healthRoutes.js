/**
 * @file healthRoutes.js
 * @description Liveness and readiness probes.
 *
 * These endpoints are intentionally lightweight — no database calls on the
 * liveness check so a container orchestrator can verify the process is alive
 * without adding DB load on every polling interval.
 *
 * Endpoints:
 *   GET /health        - Liveness: is the process running?
 *   GET /health/ready  - Readiness: is MongoDB connected?
 */

import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// ── Liveness ──────────────────────────────────────────────────────────────────
// Returns 200 as long as the Node process is alive.
router.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Readiness ─────────────────────────────────────────────────────────────────
// Returns 200 only when the MongoDB connection is established.
router.get("/ready", (_req, res) => {
  const state = mongoose.connection.readyState;
  //  0 = disconnected | 1 = connected | 2 = connecting | 3 = disconnecting
  const isReady = state === 1;

  res.status(isReady ? 200 : 503).json({
    status:   isReady ? "ready" : "not ready",
    database: isReady ? "connected" : "disconnected",
    dbState:  state,
  });
});

export default router;
