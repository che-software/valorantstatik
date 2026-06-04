// MatchProcessor — maç veri işleme servisi
// transformer.ts ve stats-processor.ts üzerine inşa edilmiştir; onları silmez.
import { transformMatch, type TransformedMatch } from "@/lib/transformer";
import { processStats, type LifetimeStats } from "@/lib/stats-processor";

export interface PlayerMatchStats {
  puuid:     string;
  acs:       number;
  adr:       number;
  kd:        number;
  hsPercent: number;
  kills:     number;
  deaths:    number;
  assists:   number;
}

/**
 * Ham API maç nesnesini normalize edilmiş TransformedMatch'e dönüştürür.
 * transformer.ts::transformMatch üzerine ince bir sarmalayıcıdır.
 */
export function processMatch(rawMatch: unknown): TransformedMatch {
  return transformMatch(rawMatch as Parameters<typeof transformMatch>[0]);
}

/**
 * Belirli bir oyuncunun tek maç istatistiklerini hesaplar.
 * @throws Oyuncu maçta bulunamazsa Error fırlatır.
 */
export function processPlayerStats(
  match: TransformedMatch,
  puuid: string
): PlayerMatchStats {
  const player = match.players.find(p => p.puuid === puuid);
  if (!player) throw new Error(`Player ${puuid} not found in match ${match.matchId}`);

  const totalShots = player.stats.headshots + player.stats.bodyshots + player.stats.legshots;
  const kd = player.stats.deaths > 0
    ? parseFloat((player.stats.kills / player.stats.deaths).toFixed(2))
    : player.stats.kills;

  return {
    puuid,
    acs:       player.acs,
    adr:       player.adr,
    kd,
    hsPercent: totalShots > 0 ? Math.round((player.stats.headshots / totalShots) * 100) : 0,
    kills:     player.stats.kills,
    deaths:    player.stats.deaths,
    assists:   player.stats.assists,
  };
}

/**
 * Kills dizisinden belirli bir oyuncunun silah bazlı kill dağılımını çıkarır.
 */
export function processWeaponKills(
  kills: unknown[],
  puuid: string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const kill of kills) {
    const k = kill as { killer_puuid?: string; damage_weapon_name?: string };
    if (k.killer_puuid === puuid && k.damage_weapon_name) {
      result[k.damage_weapon_name] = (result[k.damage_weapon_name] ?? 0) + 1;
    }
  }
  return result;
}

/**
 * Birden fazla maç üzerinden yaşam boyu istatistikleri hesaplar.
 * stats-processor.ts::processStats üzerine ince bir sarmalayıcıdır.
 */
export function processLifetimeStats(
  matches: TransformedMatch[],
  name: string,
  tag: string
): LifetimeStats {
  return processStats(matches, name, tag);
}
