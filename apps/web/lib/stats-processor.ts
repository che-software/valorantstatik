import { TransformedMatch } from "./transformer";

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

export function processStats(
  matches: TransformedMatch[],
  playerName: string,
  playerTag: string
): LifetimeStats {
  const weaponMap: Record<string, { kills: number; hs: number; body: number; leg: number }> = {};
  const mapMap:    Record<string, { played: number; wins: number; acsSum: number; kills: number; deaths: number }> = {};
  const agentMap:  Record<string, { icon: string; played: number; wins: number; kills: number; deaths: number; assists: number; acsSum: number; minutes: number }> = {};

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

    const team = player.team as "red" | "blue";
    const won  = match.teams[team]?.won ?? false;
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

    // Weapon stats from kills array
    for (const [weapon, kills] of Object.entries(player.weaponKills)) {
      if (!weaponMap[weapon]) weaponMap[weapon] = { kills: 0, hs: 0, body: 0, leg: 0 };
      weaponMap[weapon].kills += kills;
      // approximate hs distribution proportionally
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

    // Agent stats
    const agentKey = player.character;
    if (!agentMap[agentKey]) agentMap[agentKey] = { icon: player.agentIcon, played: 0, wins: 0, kills: 0, deaths: 0, assists: 0, acsSum: 0, minutes: 0 };
    agentMap[agentKey].played++;
    if (won) agentMap[agentKey].wins++;
    agentMap[agentKey].kills   += player.stats.kills;
    agentMap[agentKey].deaths  += player.stats.deaths;
    agentMap[agentKey].assists += player.stats.assists;
    agentMap[agentKey].acsSum  += player.acs;
    agentMap[agentKey].minutes += match.duration;
  }

  const totalShots = totalHS + totalBody + totalLeg;

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
    .map(([agent, s]) => ({
      agent,
      agentIcon:     s.icon,
      played:        s.played,
      wins:          s.wins,
      winRate:       Math.round((s.wins / s.played) * 100),
      kills:         s.kills,
      deaths:        s.deaths,
      assists:       s.assists,
      kda:           s.deaths > 0 ? parseFloat(((s.kills + s.assists / 2) / s.deaths).toFixed(2)) : s.kills,
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
    kd:         totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills,
    kda:        totalDeaths > 0 ? parseFloat(((totalKills + totalAssists / 2) / totalDeaths).toFixed(2)) : totalKills,
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
