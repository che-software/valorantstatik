/**
 * @file playerRoutes.js
 * @description RESTful routes for player profile, match history and statistics.
 *
 * Base path: /api/v1/players
 *
 * Endpoints:
 *   GET /api/v1/players/:name/:tag          - Current rank + account info
 *   GET /api/v1/players/:name/:tag/matches  - Recent match history
 *   GET /api/v1/players/:name/:tag/stats    - Lifetime aggregated statistics
 *   GET /api/v1/players/:name/:tag/full     - All of the above in one request
 */

import { Router } from "express";
import {
  getProfile,
  getMatches,
  getStats,
  getFullProfile,
} from "../controllers/playerController.js";

const router = Router();

// ── Profile ────────────────────────────────────────────────────────────────
// Returns account details and current rank snapshot.
router.get("/:name/:tag", getProfile);

// ── Match history ──────────────────────────────────────────────────────────
// ?size=10  (max 20)
router.get("/:name/:tag/matches", getMatches);

// ── Lifetime stats ─────────────────────────────────────────────────────────
// ?size=20  (max 50) — uses the last N matches for the aggregation
router.get("/:name/:tag/stats", getStats);

// ── Full profile (combined) ────────────────────────────────────────────────
// Convenience: profile + matches + stats in one round-trip.
router.get("/:name/:tag/full", getFullProfile);

export default router;
