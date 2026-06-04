/**
 * @file leaderboardController.js
 * @description Handles leaderboard requests — fetches from HenrikDev and
 *              caches results in MongoDB.
 */

import { henrikGet } from "./riotApiClient.js";
import { CachedResponse } from "../models/CachedResponse.js";

const TTL_LEADERBOARD = 10 * 60; // 10 minutes — leaderboard changes slowly

/**
 * GET /api/v1/leaderboard/:region?page=1
 *
 * Returns the top 50 players for a given region.
 * Supported regions: eu, na, ap, kr, latam, br
 *
 * @type {import("express").RequestHandler}
 */
export async function getLeaderboard(req, res, next) {
  try {
    const region = (req.params.region ?? "eu").toLowerCase();
    const page   = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const size   = 50;
    const start  = (page - 1) * size;

    const VALID_REGIONS = ["eu", "na", "ap", "kr", "latam", "br"];
    if (!VALID_REGIONS.includes(region)) {
      return res.status(400).json({
        error: `Invalid region. Must be one of: ${VALID_REGIONS.join(", ")}`,
      });
    }

    const cacheKey = `leaderboard:${region}:${page}`;
    const cached   = await CachedResponse.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const raw = await henrikGet(`/v2/leaderboard/${region}?start=${start}&size=${size}`);

    const payload = {
      players:    raw?.players    ?? [],
      region,
      page,
      total:      raw?.total_players ?? 0,
      lastUpdate: raw?.last_update   ?? null,
    };

    CachedResponse.set(cacheKey, payload, TTL_LEADERBOARD).catch(() => {});

    return res.json({ ...payload, cached: false });
  } catch (err) {
    next(err);
  }
}
