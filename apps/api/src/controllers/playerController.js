/**
 * @file playerController.js
 * @description Express request handlers for all player-related endpoints.
 *
 * Controller responsibilities:
 *   1. Validate and sanitise path / query parameters.
 *   2. Delegate data fetching to the Riot API client.
 *   3. Persist results to MongoDB in the background (non-blocking).
 *   4. Return a consistent JSON response shape.
 *
 * Every public function is an async Express middleware that catches its own
 * errors and calls next(err) so the centralised error handler takes over.
 */

import { henrikGet, ApiError } from "./riotApiClient.js";
import { transformPlayer, transformMatch } from "./transformers.js";
import { processLifetimeStats, calcTiltStats } from "./statsProcessor.js";
import { Player } from "../models/Player.js";
import { Match } from "../models/Match.js";
import { CachedResponse } from "../models/CachedResponse.js";

// ── Cache TTL constants (seconds) ─────────────────────────────────────────────
const TTL = {
  profile:  5  * 60,  //  5 minutes — rank changes infrequently
  matches:  3  * 60,  //  3 minutes
  stats:    5  * 60,
};

// ── Input validation helpers ──────────────────────────────────────────────────

const INVALID_CHARS = /[<>"'`\\;{}]/;

/**
 * Validates and sanitises a Riot Name + Tag pair.
 * Throws an ApiError(400) if the input is invalid.
 *
 * @param {string} rawName
 * @param {string} rawTag
 * @returns {{ name: string, tag: string }}
 */
function validateRiotId(rawName, rawTag) {
  const name = rawName?.trim().slice(0, 64);
  const tag  = rawTag?.trim().slice(0, 16);

  if (!name || !tag) {
    throw new ApiError("Both name and tag parameters are required.", 400);
  }

  if (INVALID_CHARS.test(name) || INVALID_CHARS.test(tag)) {
    throw new ApiError("Name or tag contains invalid characters.", 400);
  }

  return { name, tag };
}

// ── Background persistence helpers ───────────────────────────────────────────

/**
 * Upserts a player document in MongoDB using the PUUID as the natural key.
 * Runs in the background — the HTTP response is NOT blocked by this call.
 *
 * @param {object} player - Normalised player object from transformPlayer().
 */
function persistPlayerBackground(player) {
  Player.findOneAndUpdate(
    { puuid: player.puuid },
    {
      $set: {
        name:   player.name,
        tag:    player.tag,
        region: player.region,
        level:  player.level,
        card:   player.card,
        rank:   player.rank,
      },
    },
    { upsert: true, new: true }
  )
    .then(() => console.log(`[PlayerCtrl] Persisted player: ${player.name}#${player.tag}`))
    .catch((err) => console.error("[PlayerCtrl] DB persist error:", err.message));
}

/**
 * Upserts an array of match documents.
 * Uses bulkWrite with ordered: false so a single duplicate does not abort
 * the entire batch.
 *
 * @param {object[]} matches - Normalised match objects.
 */
function persistMatchesBackground(matches) {
  if (!matches.length) return;

  const ops = matches.map((m) => ({
    updateOne: {
      filter: { matchId: m.matchId },
      update: { $setOnInsert: m },
      upsert: true,
    },
  }));

  Match.bulkWrite(ops, { ordered: false })
    .then((result) => console.log(`[PlayerCtrl] Upserted ${result.upsertedCount} new matches`))
    .catch((err) => console.error("[PlayerCtrl] Match persist error:", err.message));
}

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * GET /api/v1/players/:name/:tag
 *
 * Returns the player's account info and current rank.
 * Falls back to the MongoDB snapshot when HenrikDev is unavailable.
 *
 * @type {import("express").RequestHandler}
 */
export async function getProfile(req, res, next) {
  try {
    const { name, tag } = validateRiotId(req.params.name, req.params.tag);

    // ── Cache check ───────────────────────────────────────────────────────────
    const cacheKey = `profile:${name.toLowerCase()}:${tag.toLowerCase()}`;
    const cached   = await CachedResponse.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // ── Fetch from HenrikDev in parallel ─────────────────────────────────────
    const n = encodeURIComponent(name);
    const t = encodeURIComponent(tag);

    let account;
    try {
      account = await henrikGet(`/v1/account/${n}/${t}`);
    } catch (err) {
      // Specific fallback: try the database if we have a previous snapshot.
      const dbPlayer = await Player.findOne({
        name: new RegExp(`^${name}$`, "i"),
        tag:  new RegExp(`^${tag}$`,  "i"),
      }).lean();

      if (dbPlayer) {
        console.warn(`[PlayerCtrl] API unavailable — serving stale DB data for ${name}#${tag}`);
        return res.json({ player: dbPlayer, cached: true, stale: true, warning: "Served from database snapshot." });
      }

      throw err; // No fallback available — propagate to error handler.
    }

    if (!account?.puuid) {
      throw new ApiError("Player not found.", 404);
    }

    const region = account.region ?? "eu";

    // Rank and matches can fail independently — use allSettled.
    const [rankResult] = await Promise.allSettled([
      henrikGet(`/v2/mmr/${region}/${n}/${t}`),
    ]);

    const rankData = rankResult.status === "fulfilled" ? rankResult.value : null;

    if (rankResult.status === "rejected") {
      console.warn(`[PlayerCtrl] Rank unavailable for ${name}#${tag}:`, rankResult.reason.message);
    }

    const player = transformPlayer(account, rankData);

    // ── Persist & cache (non-blocking) ────────────────────────────────────────
    persistPlayerBackground(player);
    CachedResponse.set(cacheKey, { player }, TTL.profile).catch(() => {});

    return res.json({ player, cached: false });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/players/:name/:tag/matches?size=10
 *
 * Returns the player's recent match history, normalised into a compact shape.
 *
 * @type {import("express").RequestHandler}
 */
export async function getMatches(req, res, next) {
  try {
    const { name, tag } = validateRiotId(req.params.name, req.params.tag);
    const size = Math.min(parseInt(req.query.size ?? "10", 10), 20);

    const cacheKey = `matches:${name.toLowerCase()}:${tag.toLowerCase()}:${size}`;
    const cached   = await CachedResponse.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const n = encodeURIComponent(name);
    const t = encodeURIComponent(tag);

    // We need the region from the account endpoint first.
    const account = await henrikGet(`/v1/account/${n}/${t}`);
    const region  = account?.region ?? "eu";

    const rawMatches = await henrikGet(`/v3/matches/${region}/${n}/${t}?size=${size}`);
    const matches    = Array.isArray(rawMatches) ? rawMatches.map(transformMatch) : [];

    persistMatchesBackground(matches);
    CachedResponse.set(cacheKey, { matches }, TTL.matches).catch(() => {});

    return res.json({ matches, cached: false });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/players/:name/:tag/stats?size=20
 *
 * Returns aggregated lifetime statistics derived from the player's recent
 * match history, plus a tilt score.
 *
 * @type {import("express").RequestHandler}
 */
export async function getStats(req, res, next) {
  try {
    const { name, tag } = validateRiotId(req.params.name, req.params.tag);
    const size = Math.min(parseInt(req.query.size ?? "20", 10), 50);

    const cacheKey = `stats:${name.toLowerCase()}:${tag.toLowerCase()}:${size}`;
    const cached   = await CachedResponse.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const n = encodeURIComponent(name);
    const t = encodeURIComponent(tag);

    const account    = await henrikGet(`/v1/account/${n}/${t}`);
    const region     = account?.region ?? "eu";
    const rawMatches = await henrikGet(`/v3/matches/${region}/${n}/${t}?size=${size}`);
    const matches    = Array.isArray(rawMatches) ? rawMatches.map(transformMatch) : [];

    const lifetimeStats = processLifetimeStats(matches, name, tag);
    const tiltStats     = calcTiltStats(matches, name, tag);

    const payload = { stats: lifetimeStats, tilt: tiltStats };

    CachedResponse.set(cacheKey, payload, TTL.stats).catch(() => {});

    return res.json({ ...payload, cached: false });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/players/:name/:tag/full
 *
 * Convenience endpoint — returns profile + matches + stats in a single
 * request.  Useful for the initial page load on the frontend.
 *
 * @type {import("express").RequestHandler}
 */
export async function getFullProfile(req, res, next) {
  try {
    const { name, tag } = validateRiotId(req.params.name, req.params.tag);
    const size = 20;

    const cacheKey = `full:${name.toLowerCase()}:${tag.toLowerCase()}`;
    const cached   = await CachedResponse.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const n = encodeURIComponent(name);
    const t = encodeURIComponent(tag);

    const account = await henrikGet(`/v1/account/${n}/${t}`);

    if (!account?.puuid) throw new ApiError("Player not found.", 404);

    const region = account.region ?? "eu";

    // Fetch rank and matches in parallel.
    const [rankResult, matchesResult] = await Promise.allSettled([
      henrikGet(`/v2/mmr/${region}/${n}/${t}`),
      henrikGet(`/v3/matches/${region}/${n}/${t}?size=${size}`),
    ]);

    const rankData   = rankResult.status    === "fulfilled" ? rankResult.value    : null;
    const rawMatches = matchesResult.status === "fulfilled" ? matchesResult.value : [];

    if (rankResult.status    === "rejected") console.warn("[PlayerCtrl] Rank fetch failed:", rankResult.reason.message);
    if (matchesResult.status === "rejected") console.warn("[PlayerCtrl] Matches fetch failed:", matchesResult.reason.message);

    const player  = transformPlayer(account, rankData);
    const matches = Array.isArray(rawMatches) ? rawMatches.map(transformMatch) : [];

    const stats = processLifetimeStats(matches, name, tag);
    const tilt  = calcTiltStats(matches, name, tag);

    persistPlayerBackground(player);
    persistMatchesBackground(matches);

    const payload = { player, matches, stats, tilt };
    CachedResponse.set(cacheKey, payload, TTL.profile).catch(() => {});

    return res.json({ ...payload, cached: false });
  } catch (err) {
    next(err);
  }
}
