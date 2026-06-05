import { TransformedMatch } from "./transformer";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface WeaponStat {
  weapon: string;
  kills: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  hsPercent: number;
}

export interface MapStat {
  map: string;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
  avgAcs: number;
  avgKd: number;
}

export interface AgentMapStat {
  map: string;
  played: number;
  winRate: number;
  avgAcs: number;
  avgKd: number;
}

export interface AgentStat {
  agent: string;
  agentIcon: string;
  played: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  avgAcs: number;
  minutesPlayed: number;
  mapBreakdown: AgentMapStat[];
  bestMap: string | null;
  worstMap: string | null;
  mainScore: number;
  mainVerdict: "main" | "secondary" | "situational" | "avoid";
  mainReason: string;
}

export interface LifetimeStats {
  matches: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  kda: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  hsPercent: number;
  totalDamage: number;
  totalRounds: number;
  adr: number;
  avgAcs: number;
  weapons: WeaponStat[];
  maps: MapStat[];
  agents: AgentStat[];
}

// ── Agent role lookup ─────────────────────────────────────────────────────────

const AGENT_ROLES: Record<string, string> = {
  Jett: "Duelist",   Reyna: "Duelist",     Raze: "Duelist",    Phoenix: "Duelist",
  Neon: "Duelist",   Yoru: "Duelist",      Iso: "Duelist",     Waylay: "Duelist",
  Brimstone: "Controller", Viper: "Controller", Omen: "Controller",
  Astra: "Controller",     Harbor: "Controller", Clove: "Controller",
  Sova: "Initiator", Breach: "Initiator",  Skye: "Initiator",
  Fade: "Initiator", KAY0: "Initiator",    Gekko: "Initiator", Tejo: "Initiator",
  Sage: "Sentinel",  Cypher: "Sentinel",   Killjoy: "Sentinel",
  Chamber: "Sentinel", Deadlock: "Sentinel", Vyse: "Sentinel",
};

export function getAgentRole(agent: string): string {
  return AGENT_ROLES[agent] ?? "Unknown";
}

// ── Main score calculator ─────────────────────────────────────────────────────

function calcMainScore(
  winRate: number, kda: number, avgAcs: number, played: number,
  overallWinRate: number, overallKda: number, overallAcs: number
): { score: number; verdict: AgentStat["mainVerdict"]; reason: string } {
  const wrDelta  = winRate - overallWinRate;
  const kdaDelta = kda     - overallKda;
  const acsDelta = avgAcs  - overallAcs;

  let score = 50;
  score += wrDelta  * 0.6;
  score += kdaDelta * 8;
  score += acsDelta * 0.08;
  score += Math.min(played * 2, 15);
  score  = Math.max(0, Math.min(100, Math.round(score)));

  let verdict: AgentStat["mainVerdict"];
  let reason: string;

  if (score >= 70) {
    verdict = "main";
    reason  = `${winRate}% WR and ${kda} KDA — clearly your strongest agent. Make this your main.`;
  } else if (score >= 55) {
    verdict = "secondary";
    reason  = `Solid performance (${winRate}% WR). Great as a secondary pick or when your main is unavailable.`;
  } else if (score >= 40) {
    verdict = "situational";
    reason  = `Average results (${winRate}% WR). Play this only on specific maps where you perform well.`;
  } else {
    verdict = "avoid";
    reason  = `Below your average (${winRate}% WR, ${kda} KDA). Consider switching to a stronger agent.`;
  }

  return { score, verdict, reason };
}

// ── processStats ──────────────────────────────────────────────────────────────

export function processStats(
  matches: TransformedMatch[],
  playerName: string,
  playerTag: string
): LifetimeStats {
  const weaponMap: Record<string, { kills: number; hs: number; body: number; leg: number }> = {};
  const mapMap:    Record<string, { played: number; wins: number; acsSum: number; kills: number; deaths: number }> = {};
  const agentMap:  Record<string, {
    icon: string; played: number; wins: number;
    kills: number; deaths: number; assists: number;
    acsSum: number; minutes: number;
    byMap: Record<string, { played: number; wins: number; acsSum: number; kills: number; deaths: number }>;
  }> = {};

  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalHS = 0, totalBody = 0, totalLeg = 0;
  let totalDamage = 0, totalRounds = 0, totalAcs = 0;
  let wins = 0;

  for (const match of matches) {
    const player = match.players.find(
      p => p.name.toLowerCase() === playerName.toLowerCase() &&
           p.tag.toLowerCase()  === playerTag.toLowerCase()
    );
    if (!player) continue;

    const team   = player.team as "red" | "blue";
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

    // Weapon stats
    for (const [weapon, kills] of Object.entries(player.weaponKills)) {
      if (!weaponMap[weapon]) weaponMap[weapon] = { kills: 0, hs: 0, body: 0, leg: 0 };
      weaponMap[weapon].kills += kills;
      const total = player.stats.headshots + player.stats.bodyshots + player.stats.legshots;
      if (total > 0) {
        weaponMap[weapon].hs   += Math.round((player.stats.headshots / total) * kills);
        weaponMap[weapon].body += Math.round((player.stats.bodyshots / total) * kills);
        weaponMap[weapon].leg  += Math.round((player.stats.legshots  / total) * kills);
      }
    }

    // Map stats
    const mapKey = match.map;
    if (!mapMap[mapKey]) mapMap[mapKey] = { played: 0, wins: 0, acsSum: 0, kills: 0, deaths: 0 };
    mapMap[mapKey].played++;
    if (won) mapMap[mapKey].wins++;
    mapMap[mapKey].acsSum  += player.acs;
    mapMap[mapKey].kills   += player.stats.kills;
    mapMap[mapKey].deaths  += player.stats.deaths;

    // Agent stats + per-map breakdown
    const agentKey = player.character;
    if (!agentMap[agentKey]) {
      agentMap[agentKey] = {
        icon: player.agentIcon, played: 0, wins: 0,
        kills: 0, deaths: 0, assists: 0,
        acsSum: 0, minutes: 0, byMap: {},
      };
    }
    agentMap[agentKey].played++;
    if (won) agentMap[agentKey].wins++;
    agentMap[agentKey].kills   += player.stats.kills;
    agentMap[agentKey].deaths  += player.stats.deaths;
    agentMap[agentKey].assists += player.stats.assists;
    agentMap[agentKey].acsSum  += player.acs;
    agentMap[agentKey].minutes += match.duration;

    if (!agentMap[agentKey].byMap[mapKey]) {
      agentMap[agentKey].byMap[mapKey] = { played: 0, wins: 0, acsSum: 0, kills: 0, deaths: 0 };
    }
    agentMap[agentKey].byMap[mapKey].played++;
    if (won) agentMap[agentKey].byMap[mapKey].wins++;
    agentMap[agentKey].byMap[mapKey].acsSum  += player.acs;
    agentMap[agentKey].byMap[mapKey].kills   += player.stats.kills;
    agentMap[agentKey].byMap[mapKey].deaths  += player.stats.deaths;
  }

  const totalShots     = totalHS + totalBody + totalLeg;
  const overallWinRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 50;
  const overallKda     = totalDeaths > 0 ? parseFloat(((totalKills + totalAssists / 2) / totalDeaths).toFixed(2)) : totalKills;
  const overallAcs     = matches.length > 0 ? Math.round(totalAcs / matches.length) : 0;

  const weapons: WeaponStat[] = Object.entries(weaponMap)
    .map(([weapon, s]) => {
      const shots = s.hs + s.body + s.leg || 1;
      return { weapon, kills: s.kills, headshots: s.hs, bodyshots: s.body, legshots: s.leg, hsPercent: Math.round((s.hs / shots) * 100) };
    })
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 5);

  const maps: MapStat[] = Object.entries(mapMap)
    .map(([map, s]) => ({
      map,
      played:  s.played,
      wins:    s.wins,
      losses:  s.played - s.wins,
      winRate: Math.round((s.wins / s.played) * 100),
      avgAcs:  Math.round(s.acsSum / s.played),
      avgKd:   s.deaths > 0 ? parseFloat((s.kills / s.deaths).toFixed(2)) : s.kills,
    }))
    .sort((a, b) => b.played - a.played);

  const agents: AgentStat[] = Object.entries(agentMap)
    .map(([agent, s]) => {
      const winRate = Math.round((s.wins / s.played) * 100);
      const kda     = s.deaths > 0 ? parseFloat(((s.kills + s.assists / 2) / s.deaths).toFixed(2)) : s.kills;
      const avgAcs  = Math.round(s.acsSum / s.played);

      const mapBreakdown: AgentMapStat[] = Object.entries(s.byMap)
        .map(([map, ms]) => ({
          map,
          played:  ms.played,
          winRate: Math.round((ms.wins / ms.played) * 100),
          avgAcs:  Math.round(ms.acsSum / ms.played),
          avgKd:   ms.deaths > 0 ? parseFloat((ms.kills / ms.deaths).toFixed(2)) : ms.kills,
        }))
        .sort((a, b) => b.winRate - a.winRate);

      const bestMap  = mapBreakdown[0]?.map ?? null;
      const worstMap = mapBreakdown.length > 1 ? mapBreakdown[mapBreakdown.length - 1].map : null;

      const { score, verdict, reason } = calcMainScore(
        winRate, kda, avgAcs, s.played,
        overallWinRate, overallKda, overallAcs
      );

      return {
        agent, agentIcon: s.icon,
        played: s.played, wins: s.wins, winRate,
        kills: s.kills, deaths: s.deaths, assists: s.assists,
        kda, avgAcs, minutesPlayed: s.minutes,
        mapBreakdown, bestMap, worstMap,
        mainScore: score, mainVerdict: verdict, mainReason: reason,
      };
    })
    .sort((a, b) => b.played - a.played);

  return {
    matches:    matches.length,
    wins,
    winRate:    overallWinRate,
    kills:      totalKills,
    deaths:     totalDeaths,
    assists:    totalAssists,
    kd:         totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills,
    kda:        overallKda,
    headshots:  totalHS,
    bodyshots:  totalBody,
    legshots:   totalLeg,
    hsPercent:  totalShots > 0 ? Math.round((totalHS / totalShots) * 100) : 0,
    totalDamage,
    totalRounds,
    adr:        totalRounds > 0 ? Math.round(totalDamage / totalRounds) : 0,
    avgAcs:     overallAcs,
    weapons,
    maps,
    agents,
  };
}
