/**
 * @file leaderboardRoutes.js
 * @description Routes for the competitive leaderboard.
 *
 * Base path: /api/v1/leaderboard
 *
 * Endpoints:
 *   GET /api/v1/leaderboard/:region   - Top 50 players in the given region
 */

import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = Router();

// :region — one of: eu, na, ap, kr, latam, br
// ?page=1  (50 players per page)
router.get("/:region", getLeaderboard);

export default router;
