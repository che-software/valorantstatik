/**
 * @file statsProcessor.js
 * @description Aggregates a collection of normalised match records into the
 *              lifetime statistics shape consumed by the frontend.
 *
 * All functions are pure — they only read their arguments and return new
 * objects.  There are no database calls here; persistence concerns live in
 * playerController.js.
 */

// ── Lifetime stats ────────────────────────────────────────────────────────────

/**
 * Computes aggregate lifetime statistics for a player from their match history.
 *
 * @param {object[]} matches    - Array of normalised match objects.
 * @param {string}   playerName - Riot display name (case-insensitive match).
 * @param {string}   playerTag  - Riot tag (case-insensitive match).
 * @returns {object} Comprehensive lifetime stats including per-weapon, per-map
 *                   and per-agent breakdowns.
 */
export function processLifetimeStats(matches, playerName, playerTag) {
  // Accumulators for rolling totals.
  const weaponMap = {}; // weapon → { kills, hs, body, leg }
  const mapMap    = {}; // map    → { played, wins, acsSum, kills, deaths }
  const agentMap  = {}; // agent  → { icon, played, wins, kills, deaths, assists, acsSum, minutes }

  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalHS    = 0, totalBody   = 0, totalLeg     = 0;
  let totalDamage = 0, totalRounds = 0, totalAcs = 0;
  let wins = 0;

  const nameLower = playerName.toLowerCase();
  const tagLower  = playerTag.toLowerCase();

  for (const match of matches) {
    const player = match.players.find(
      (p) =>
        p.name.toLowerCase() === nameLower &&
        p.tag.toLowerCase()  === tagLower
    );

    // Skip matches where this player's data is missing.
    if (!player) continue;

    const team   = player.team;              // "red" | "blue"
    const won    = match.teams[team]?.won ?? false;
    const rounds = match.rounds || 1;

    if (won) wins++;

    totalKills   += player.stats.kills;
    totalDeaths  += player.stats.deaths;
    totalAssists += player.stats.assists;
    totalHS      += player.stats.headshots;
    totalBody    += player.stats.bodyshots;
    totalLeg     += player.stats.legshots;
    totalDamage  += player.damageMade;
    totalRounds  += rounds;
    totalAcs     += player.acs;

    // ── Weapon breakdown ──────────────────────────────────────────────────────
    for (const [weapon, kills] of Object.entries(player.weaponKills)) {
      if (!weaponMap[weapon]) weaponMap[weapon] = { kills: 0, hs: 0, body: 0, leg: 0 };
      weaponMap[weapon].kills += kills;

      // Approximate per-weapon shot distribution proportionally to overall totals.
      const totalShots =
        player.stats.headshots + player.stats.bodyshots + player.stats.legshots;

      if (totalShots > 0) {
        weaponMap[weapon].hs   += Math.round((player.stats.headshots / totalShots) * kills);
        weaponMap[weapon].body += Math.round((player.stats.bodyshots / totalShots) * kills);
        weaponMap[weapon].leg  += Math.round((player.stats.legshots  / totalShots) * kills);
      }
    }

    // ── Map breakdown ─────────────────────────────────────────────────────────
    if (!mapMap[match.map]) {
      mapMap[match.map] = { played: 0, wins: 0, acsSum: 0, kills: 0, deaths: 0 };
    }
    mapMap[match.map].played++;
    if (won) mapMap[match.map].wins++;
    mapMap[match.map].acsSum  += player.acs;
    mapMap[match.map].kills   += player.stats.kills;
    mapMap[match.map].deaths  += player.stats.deaths;

    // ── Agent breakdown ───────────────────────────────────────────────────────
    const agentKey = player.character;
    if (!agentMap[agentKey]) {
      agentMap[agentKey] = {
        icon:    player.agentIcon,
        played:  0, wins:    0,
        kills:   0, deaths:  0, assists: 0,
        acsSum:  0, minutes: 0,
      };
    }
    agentMap[agentKey].played++;
    if (won) agentMap[agentKey].wins++;
    agentMap[agentKey].kills   += player.stats.kills;
    agentMap[agentKey].deaths  += player.stats.deaths;
    agentMap[agentKey].assists += player.stats.assists;
    agentMap[agentKey].acsSum  += player.acs;
    agentMap[agentKey].minutes += match.duration;
  }

  // ── Build output arrays ───────────────────────────────────────────────────

  const totalShots = totalHS + totalBody + totalLeg;

  const weapons = Object.entries(weaponMap)
    .map(([weapon, s]) => {
      const shots = s.hs + s.body + s.leg || 1;
      return {
        weapon,
        kills:     s.kills,
        headshots: s.hs,
        bodyshots: s.body,
        legshots:  s.leg,
        hsPercent: Math.round((s.hs / shots) * 100),
      };
    })
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 5); // top 5 weapons

  const maps = Object.entries(mapMap)
    .map(([map, s]) => ({
      map,
      played:  s.played,
      wins:    s.wins,
      losses:  s.played - s.wins,
      winRate: Math.round((s.wins / s.played) * 100),
      avgAcs:  Math.round(s.acsSum / s.played),
      avgKd:   s.deaths > 0
        ? parseFloat((s.kills / s.deaths).toFixed(2))
        : s.kills,
    }))
    .sort((a, b) => b.played - a.played);

  const agents = Object.entries(agentMap)
    .map(([agent, s]) => ({
      agent,
      agentIcon:     s.icon,
      played:        s.played,
      wins:          s.wins,
      winRate:       Math.round((s.wins / s.played) * 100),
      kills:         s.kills,
      deaths:        s.deaths,
      assists:       s.assists,
      kda:           s.deaths > 0
        ? parseFloat(((s.kills + s.assists / 2) / s.deaths).toFixed(2))
        : s.kills,
      avgAcs:        Math.round(s.acsSum / s.played),
      minutesPlayed: s.minutes,
    }))
    .sort((a, b) => b.played - a.played);

  return {
    matches:    matches.length,
    wins,
    winRate:    matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    kills:      totalKills,
    deaths:     totalDeaths,
    assists:    totalAssists,
    kd:         totalDeaths > 0
      ? parseFloat((totalKills / totalDeaths).toFixed(2))
      : totalKills,
    kda:        totalDeaths > 0
      ? parseFloat(((totalKills + totalAssists / 2) / totalDeaths).toFixed(2))
      : totalKills,
    headshots:  totalHS,
    bodyshots:  totalBody,
    legshots:   totalLeg,
    hsPercent:  totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0,
    totalDamage,
    totalRounds,
    adr:        totalRounds > 0 ? Math.round(totalDamage / totalRounds) : 0,
    avgAcs:     matches.length > 0 ? Math.round(totalAcs / matches.length) : 0,
    weapons,
    maps,
    agents,
  };
}

// ── Tilt score (mental coach) ─────────────────────────────────────────────────

/**
 * Analyses the last 5 matches to produce a "tilt" score — an opinionated
 * indicator of whether the player is on a hot streak, focused, or tilting.
 *
 * @param {object[]} matches
 * @param {string}   playerName
 * @param {string}   playerTag
 * @returns {object} Tilt stats including a label, score, emoji and advice.
 */
export function calcTiltStats(matches, playerName, playerTag) {
  const recent = matches.slice(0, 5);

  if (recent.length === 0) {
    return {
      level: "focused", score: 70, label: "No Data",
      advice: "Play some games first!", emoji: "❓",
      recentWinRate: 0, kdTrend: 0, indicators: [],
    };
  }

  const nameLower = playerName.toLowerCase();
  const tagLower  = playerTag.toLowerCase();

  let wins = 0, totalKd = 0, totalAcs = 0;
  const kdList = [];

  for (const m of recent) {
    const p = m.players.find(
      (x) => x.name.toLowerCase() === nameLower && x.tag.toLowerCase() === tagLower
    );
    if (!p) continue;

    if (m.teams[p.team]?.won) wins++;

    const kd = p.stats.deaths > 0 ? p.stats.kills / p.stats.deaths : p.stats.kills;
    totalKd  += kd;
    totalAcs += p.acs;
    kdList.push(kd);
  }

  const recentWinRate = Math.round((wins / recent.length) * 100);
  const avgKd         = totalKd  / recent.length;
  const avgAcs        = totalAcs / recent.length;

  // Compare last 2 matches vs first 3 matches to derive a K/D trend.
  const earlyKd  = kdList.slice(2).reduce((s, v) => s + v, 0) / (kdList.slice(2).length || 1);
  const lateKd   = kdList.slice(0, 2).reduce((s, v) => s + v, 0) / (kdList.slice(0, 2).length || 1);
  const kdTrend  = parseFloat((lateKd - earlyKd).toFixed(2));

  // Composite score on a 0–100 scale.
  let score = 50;
  score += recentWinRate > 50 ? 20 : recentWinRate > 30 ?  5 : -15;
  score += avgKd > 1.5         ? 15 : avgKd > 1.0         ?  5 : -10;
  score += kdTrend > 0.2       ? 10 : kdTrend < -0.3      ? -15 :  0;
  score += avgAcs > 220        ? 10 : avgAcs < 150         ? -10 :  0;
  score  = Math.max(0, Math.min(100, score));

  const indicators = [];
  if (recentWinRate < 30) indicators.push(`${recentWinRate}% win rate in last ${recent.length} games`);
  if (kdTrend < -0.3)     indicators.push("K/D trending downward");
  if (avgAcs < 150)       indicators.push("Average ACS below 150");
  if (recentWinRate > 60) indicators.push(`${recentWinRate}% win rate in last ${recent.length} games 🔥`);
  if (kdTrend > 0.2)      indicators.push("K/D trending upward ⬆️");

  const levels = [
    { min: 75, level: "fresh",    label: "On Fire",         emoji: "🔥", advice: "You're playing great! Keep it up." },
    { min: 55, level: "focused",  label: "Focused",         emoji: "✅", advice: "Good rhythm. Stay consistent." },
    { min: 35, level: "tilting",  label: "Watch Out",       emoji: "⚠️", advice: "Performance is dropping. Take a short break." },
    { min: 20, level: "tilted",   label: "Tilt Mode",       emoji: "😤", advice: "You appear tilted. A 30-minute break is recommended." },
    { min:  0, level: "rest",     label: "Time to Rest",    emoji: "😴", advice: "Call it a day — you'll play better tomorrow." },
  ];

  const { level, label, emoji, advice } = levels.find((l) => score >= l.min);

  return { level, score, label, advice, emoji, recentWinRate, kdTrend, indicators };
}
