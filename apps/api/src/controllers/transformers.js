/**
 * @file transformers.js
 * @description Pure functions that normalise raw HenrikDev API payloads into
 *              the canonical shapes used throughout this application.
 *
 * Pure functions — no side effects, no I/O — which makes them trivially
 * testable and safe to call in any context.
 */

// ── Rank lookup table ─────────────────────────────────────────────────────────

/** Valorant tier icons are served from the Riot CDN via this UUID. */
const COMPETITIVE_TIER_UUID = "03621f52-342b-cf4e-4f86-9350a49c6d04";

const RANK_MAP = {
  0:  { name: "Unranked",   color: "#9b9b9b" },
  3:  { name: "Iron 1",     color: "#8d6e63" },
  4:  { name: "Iron 2",     color: "#8d6e63" },
  5:  { name: "Iron 3",     color: "#8d6e63" },
  6:  { name: "Bronze 1",   color: "#cd7f32" },
  7:  { name: "Bronze 2",   color: "#cd7f32" },
  8:  { name: "Bronze 3",   color: "#cd7f32" },
  9:  { name: "Silver 1",   color: "#a8a9ad" },
  10: { name: "Silver 2",   color: "#a8a9ad" },
  11: { name: "Silver 3",   color: "#a8a9ad" },
  12: { name: "Gold 1",     color: "#ffd700" },
  13: { name: "Gold 2",     color: "#ffd700" },
  14: { name: "Gold 3",     color: "#ffd700" },
  15: { name: "Platinum 1", color: "#00bcd4" },
  16: { name: "Platinum 2", color: "#00bcd4" },
  17: { name: "Platinum 3", color: "#00bcd4" },
  18: { name: "Diamond 1",  color: "#b39ddb" },
  19: { name: "Diamond 2",  color: "#b39ddb" },
  20: { name: "Diamond 3",  color: "#b39ddb" },
  21: { name: "Ascendant 1",color: "#4caf50" },
  22: { name: "Ascendant 2",color: "#4caf50" },
  23: { name: "Ascendant 3",color: "#4caf50" },
  24: { name: "Immortal 1", color: "#e05c5c" },
  25: { name: "Immortal 2", color: "#e05c5c" },
  26: { name: "Immortal 3", color: "#e05c5c" },
  27: { name: "Radiant",    color: "#ffe082" },
};

const getRankInfo = (tier) => RANK_MAP[tier] ?? RANK_MAP[0];
const getRankIcon = (tier) =>
  `https://media.valorant-api.com/competitivetiers/${COMPETITIVE_TIER_UUID}/${tier}/largeicon.png`;

// ── Player transformer ────────────────────────────────────────────────────────

/**
 * Builds a normalised player profile from HenrikDev account + MMR payloads.
 *
 * @param {object} accountRaw - Response from /v1/account/:name/:tag
 * @param {object|null} rankRaw   - Response from /v2/mmr/:region/:name/:tag
 * @returns {object} Normalised player profile.
 */
export function transformPlayer(accountRaw, rankRaw) {
  let tier     = rankRaw?.currenttier      ?? 0;
  let tierName = rankRaw?.currenttierpatched ?? "Unranked";
  let rr       = rankRaw?.ranking_in_tier  ?? 0;
  let elo      = rankRaw?.elo              ?? 0;
  const rrChange = rankRaw?.mmr_change_to_last_game ?? 0;

  // Derive peak rank from the by_season historical data.
  let peakTier = tier;
  let peakName = tierName;

  if (rankRaw?.by_season) {
    const seasons = Object.values(rankRaw.by_season);
    const valid   = seasons.filter((s) => s?.final_rank > 0);

    if (valid.length > 0) {
      const peak = valid.reduce((a, b) => (b.final_rank > a.final_rank ? b : a));
      peakTier   = peak.final_rank;
      peakName   = peak.final_rank_patched;

      // If the player is currently unranked, fall back to their most recent season.
      if (!tier) {
        const latest = valid[valid.length - 1];
        tier     = latest.final_rank;
        tierName = latest.final_rank_patched;
      }
    }
  }

  // Reconstruct ELO from tier + RR when the API returns 0.
  // Formula: each tier step adds 100 MMR; Iron 1 (tier 3) starts at 100.
  if (!elo && tier > 0) {
    elo = (tier - 2) * 100 + rr;
  }

  // Reconstruct RR from ELO when the API returns 0.
  if (rr === 0 && elo > 0 && tier > 0) {
    const base    = (tier - 2) * 100;
    const derived = elo - base;
    if (derived > 0 && derived <= 100) rr = derived;
  }

  return {
    puuid:  accountRaw.puuid,
    name:   accountRaw.name,
    tag:    accountRaw.tag,
    level:  accountRaw.account_level ?? 0,
    region: accountRaw.region        ?? "eu",
    card:   accountRaw.card          ?? { small: "", large: "", wide: "" },
    rank: rankRaw
      ? {
          tier,
          name:    tierName,
          rr,
          elo,
          rrChange,
          iconUrl: getRankIcon(tier),
          color:   getRankInfo(tier).color,
          peak: {
            tier:    peakTier,
            name:    peakName,
            iconUrl: getRankIcon(peakTier),
          },
        }
      : null,
  };
}

// ── Match transformer ─────────────────────────────────────────────────────────

/**
 * Flattens a raw HenrikDev match object into a compact application shape.
 *
 * @param {object} raw - A single match entry from /v3/matches/...
 * @returns {object} Normalised match record.
 */
export function transformMatch(raw) {
  const allPlayers = raw.players?.all_players ?? [];
  const killEvents = raw.kills ?? [];

  return {
    matchId:   raw.metadata?.matchid,
    map:       raw.metadata?.map,
    mode:      raw.metadata?.mode ?? raw.metadata?.queue ?? "Competitive",
    duration:  Math.round((raw.metadata?.game_length ?? 0) / 60),
    startedAt: raw.metadata?.game_start ?? 0,
    rounds:    raw.metadata?.rounds_played ?? 0,

    teams: {
      red: {
        won:        raw.teams?.red?.has_won,
        roundsWon:  raw.teams?.red?.rounds_won,
        roundsLost: raw.teams?.red?.rounds_lost,
      },
      blue: {
        won:        raw.teams?.blue?.has_won,
        roundsWon:  raw.teams?.blue?.rounds_won,
        roundsLost: raw.teams?.blue?.rounds_lost,
      },
    },

    players: allPlayers.map((p) => {
      // Aggregate kill events per weapon for this specific player.
      const weaponKills = killEvents
        .filter((k) => k.killer_puuid === p.puuid && k.damage_weapon_name)
        .reduce((acc, k) => {
          acc[k.damage_weapon_name] = (acc[k.damage_weapon_name] ?? 0) + 1;
          return acc;
        }, {});

      const rounds = raw.metadata?.rounds_played ?? 1;
      const score  = p.stats?.score ?? 0;

      return {
        puuid:      p.puuid,
        name:       p.name,
        tag:        p.tag,
        team:       String(p.team).toLowerCase(),
        character:  p.character,
        tier:       p.currenttier ?? 0,
        tierName:   p.currenttier_patched ?? "Unranked",
        agentIcon:  p.assets?.agent?.small ?? "",
        acs:        Math.round(score / rounds),
        damageMade: p.damage_made ?? 0,
        adr:        Math.round((p.damage_made ?? 0) / rounds),
        stats: {
          score,
          kills:     p.stats?.kills     ?? 0,
          deaths:    p.stats?.deaths    ?? 0,
          assists:   p.stats?.assists   ?? 0,
          headshots: p.stats?.headshots ?? 0,
          bodyshots: p.stats?.bodyshots ?? 0,
          legshots:  p.stats?.legshots  ?? 0,
        },
        weaponKills,
      };
    }),
  };
}
