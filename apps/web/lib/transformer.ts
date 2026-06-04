import { getRankInfo, getRankIcon } from "./rank-map";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformPlayer(accountRaw: any, rankRaw: any) {
  let tier     = (rankRaw?.currenttier as number) ?? 0;
  let tierName = (rankRaw?.currenttierpatched as string) ?? "Unranked";
  let rr       = (rankRaw?.ranking_in_tier as number) ?? 0;
  let elo      = (rankRaw?.elo as number) ?? 0;
  const rrChange = (rankRaw?.mmr_change_to_last_game as number) ?? 0;

  // Peak rank from by_season
  let peakTier = tier;
  let peakName = tierName;

  if (rankRaw?.by_season) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seasons = Object.values(rankRaw.by_season) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valid = seasons.filter((s: any) => s?.final_rank && s.final_rank > 0);
    if (valid.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const peak = valid.reduce((a: any, b: any) => (b.final_rank > a.final_rank ? b : a));
      peakTier = peak.final_rank as number;
      peakName = peak.final_rank_patched as string;
      if (!tier) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const latest = valid[valid.length - 1] as any;
        tier = latest.final_rank;
        tierName = latest.final_rank_patched;
      }
    }
  }

  // ELO 0 ise tier'dan gerçek MMR hesapla
  // Valorant: Iron1(tier3)=100, Iron2=200... Silver1=700, Gold1=1000, Plat1=1300, Diamond1=1600, Asc1=1900, Imm1=2200, Radiant=2700
  if (!elo && tier > 0) {
    elo = (tier - 2) * 100 + rr;
  }

  // RR 0 ama elo varsa elo'dan geri hesapla (API bazen 0 döner)
  if (rr === 0 && elo > 0 && tier > 0) {
    const baseElo = (tier - 2) * 100;
    const derived = elo - baseElo;
    if (derived > 0 && derived <= 100) rr = derived;
  }

  return {
    puuid:  accountRaw.puuid  as string,
    name:   accountRaw.name   as string,
    tag:    accountRaw.tag    as string,
    level:  (accountRaw.account_level ?? 0) as number,
    region: (accountRaw.region ?? "eu")     as string,
    card:   accountRaw.card   as { small: string; large: string; wide: string },
    rank: rankRaw ? {
      tier, name: tierName, rr, elo, rrChange,
      iconUrl: getRankIcon(tier),
      color:   getRankInfo(tier).color,
      peak: { tier: peakTier, name: peakName, iconUrl: getRankIcon(peakTier) },
    } : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformMatch(raw: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPlayers = (raw.players?.all_players ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kills = (raw.kills ?? []) as any[];

  return {
    matchId:   raw.metadata?.matchid  as string,
    map:       raw.metadata?.map      as string,
    mode:      (raw.metadata?.mode ?? raw.metadata?.queue ?? "Competitive") as string,
    duration:  Math.round((raw.metadata?.game_length ?? 0) / 60),
    startedAt: (raw.metadata?.game_start ?? 0) as number,
    rounds:    (raw.metadata?.rounds_played ?? 0) as number,
    teams: {
      red:  { won: raw.teams?.red?.has_won  as boolean, roundsWon: raw.teams?.red?.rounds_won  as number, roundsLost: raw.teams?.red?.rounds_lost  as number },
      blue: { won: raw.teams?.blue?.has_won as boolean, roundsWon: raw.teams?.blue?.rounds_won as number, roundsLost: raw.teams?.blue?.rounds_lost as number },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players: allPlayers.map((p: any) => {
      // weapon kills for this player from kills array
      const playerKills = kills.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (k: any) => k.killer_puuid === p.puuid && k.damage_weapon_name
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weaponMap: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      playerKills.forEach((k: any) => {
        const w = k.damage_weapon_name as string;
        if (w) weaponMap[w] = (weaponMap[w] ?? 0) + 1;
      });

      const rounds = (raw.metadata?.rounds_played ?? 1) as number;
      const score  = (p.stats?.score ?? 0) as number;

      return {
        puuid:      p.puuid      as string,
        name:       p.name       as string,
        tag:        p.tag        as string,
        team:       (p.team as string).toLowerCase(),
        character:  p.character  as string,
        tier:       (p.currenttier ?? 0)                  as number,
        tierName:   (p.currenttier_patched ?? "Unranked") as string,
        agentIcon:  p.assets?.agent?.small                 as string,
        acs:        Math.round(score / rounds),
        damageMade: (p.damage_made ?? 0)                   as number,
        adr:        Math.round((p.damage_made ?? 0) / rounds),
        stats: {
          score,
          kills:     (p.stats?.kills     ?? 0) as number,
          deaths:    (p.stats?.deaths    ?? 0) as number,
          assists:   (p.stats?.assists   ?? 0) as number,
          headshots: (p.stats?.headshots ?? 0) as number,
          bodyshots: (p.stats?.bodyshots ?? 0) as number,
          legshots:  (p.stats?.legshots  ?? 0) as number,
        },
        weaponKills: weaponMap,
      };
    }),
  };
}

export type TransformedPlayer      = ReturnType<typeof transformPlayer>;
export type TransformedMatch       = ReturnType<typeof transformMatch>;
export type TransformedMatchPlayer = TransformedMatch["players"][0];
