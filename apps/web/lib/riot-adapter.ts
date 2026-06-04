/**
 * Riot Official API → HenrikDev-compatible DTO Adapter
 * Frontend bileşenlerimiz HenrikDev formatını bekliyor, bu adapter Riot API'yi ona çeviriyor
 */

import { getMapName } from "./riot.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function adaptAccount(account: any, region: string) {
  return {
    puuid:         account.puuid as string,
    name:          account.gameName as string,
    tag:           account.tagLine as string,
    region,
    account_level: 0, // Riot API account level vermiyor, match'ten alacağız
    card: { small: "", large: "", wide: "" }, // Riot API card vermiyor
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function adaptMatch(raw: any, agents: Record<string, { name: string; icon: string }>, weapons: Record<string, string>) {
  const info = raw.matchInfo;
  const players = raw.players ?? [];
  const teams = raw.teams ?? [];
  const kills = raw.kills ?? [];
  const rounds = raw.roundResults ?? [];

  const mapName = await getMapName(info.mapId);

  // Aggregate player stats from roundResults
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerStatsMap: Record<string, { kills: number; deaths: number; assists: number; hs: number; body: number; leg: number; score: number; damage: number }> = {};

  for (const player of players) {
    const puuid = player.subject as string;
    playerStatsMap[puuid] = {
      kills: player.stats?.kills ?? 0,
      deaths: player.stats?.deaths ?? 0,
      assists: player.stats?.assists ?? 0,
      score: player.stats?.score ?? 0,
      hs: 0, body: 0, leg: 0, damage: 0,
    };
  }

  // Aggregate damage breakdown from roundResults
  for (const round of rounds) {
    for (const ps of round.playerStats ?? []) {
      const puuid = ps.subject as string;
      if (!playerStatsMap[puuid]) continue;
      for (const dmg of ps.damage ?? []) {
        playerStatsMap[puuid].hs   += dmg.headshots ?? 0;
        playerStatsMap[puuid].body += dmg.bodyshots ?? 0;
        playerStatsMap[puuid].leg  += dmg.legshots  ?? 0;
        playerStatsMap[puuid].damage += dmg.damage ?? 0;
      }
    }
  }

  // Build all_players array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPlayers = players.map((p: any) => {
    const puuid = p.subject as string;
    const stats = playerStatsMap[puuid] ?? { kills: 0, deaths: 0, assists: 0, hs: 0, body: 0, leg: 0, score: 0, damage: 0 };
    const agentId = (p.characterId as string).toLowerCase();
    const agent = agents[agentId] ?? { name: "Unknown", icon: "" };

    return {
      puuid,
      name: p.gameName as string,
      tag: p.tagLine as string,
      team: p.teamId as string,
      character: agent.name,
      currenttier: p.competitiveTier ?? 0,
      currenttier_patched: `Tier ${p.competitiveTier ?? 0}`,
      player_card: p.playerCard as string,
      stats: {
        score: stats.score,
        kills: stats.kills,
        deaths: stats.deaths,
        assists: stats.assists,
        bodyshots: stats.body,
        headshots: stats.hs,
        legshots: stats.leg,
      },
      assets: {
        agent: { small: agent.icon, full: agent.icon, bust: agent.icon, killfeed: agent.icon },
      },
      damage_made: stats.damage,
      damage_received: 0, // Riot API'de receiver damage aggregate yok
    };
  });

  // Teams
  const redTeam  = teams.find((t: { teamId: string }) => t.teamId === "Red");
  const blueTeam = teams.find((t: { teamId: string }) => t.teamId === "Blue");

  // Kills array with weapon names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const killsArray = (kills ?? []).map((k: any) => ({
    killer_puuid: k.killer as string,
    killer_display_name: players.find((p: { subject: string }) => p.subject === k.killer)?.gameName ?? "",
    victim_puuid: k.victim as string,
    victim_display_name: players.find((p: { subject: string }) => p.subject === k.victim)?.gameName ?? "",
    damage_weapon_name: k.finishingDamage?.damageItem
      ? (weapons[(k.finishingDamage.damageItem as string).toLowerCase()] ?? k.finishingDamage.damageItem)
      : null,
    kill_time_in_round: k.roundTime ?? 0,
    round: k.round ?? 0,
  }));

  return {
    metadata: {
      matchid: info.matchId as string,
      map: mapName,
      game_length: Math.round((info.gameLengthMillis ?? 0) / 1000),
      game_start: Math.round((info.gameStartMillis ?? 0) / 1000),
      rounds_played: rounds.length,
      mode: info.queueID as string,
      region: "unknown",
    },
    players: {
      all_players: allPlayers,
      red:  allPlayers.filter((p: { team: string }) => p.team === "Red"),
      blue: allPlayers.filter((p: { team: string }) => p.team === "Blue"),
    },
    teams: {
      red:  { has_won: redTeam?.won ?? false,  rounds_won: redTeam?.roundsWon ?? 0,  rounds_lost: (redTeam?.roundsPlayed ?? 0) - (redTeam?.roundsWon ?? 0) },
      blue: { has_won: blueTeam?.won ?? false, rounds_won: blueTeam?.roundsWon ?? 0, rounds_lost: (blueTeam?.roundsPlayed ?? 0) - (blueTeam?.roundsWon ?? 0) },
    },
    kills: killsArray,
  };
}

// Fake MMR response (Riot API doesn't expose individual rank, we use competitiveTier from matches)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptRank(matches: any[], puuid: string) {
  if (!matches.length) return null;
  // En son maçtan tier al
  const lastMatch = matches[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const player = lastMatch.players?.find((p: any) => p.subject === puuid);
  const tier = player?.competitiveTier ?? 0;
  if (!tier) return null;

  // Tier'dan tahmini ELO
  const elo = (tier - 2) * 100;

  return {
    currenttier: tier,
    currenttierpatched: `Tier ${tier}`,
    ranking_in_tier: 0,
    elo,
    mmr_change_to_last_game: 0,
    by_season: {}, // boş, peak rank yok
  };
}
