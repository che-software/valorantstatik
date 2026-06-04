// StatsEngine — gelişmiş istatistik hesaplama motoru
// Tüm metodlar pure function'dır; yan etki içermez.
// advanced-stats.ts üzerine inşa edilmiştir; onu silmez.
import {
  calcEconomyStats,  type EconomyStats,
  calcClutchStats,   type ClutchStats,
  calcTiltStats,     type TiltStats,
  calcDuoSynergy,    type DuoPartner,
} from "@/lib/advanced-stats";
import { processStats } from "@/lib/stats-processor";
import type { TransformedMatch } from "@/lib/transformer";
import type { AgentStat } from "@/lib/stats-processor";

const MIN_MATCHES = 3;

export interface InsufficientData {
  insufficient_data: true;
  reason: string;
  matchCount: number;
}

/** Yetersiz veri nesnesi oluşturur */
function insufficient(matchCount: number): InsufficientData {
  return { insufficient_data: true, reason: `En az ${MIN_MATCHES} maç gerekli`, matchCount };
}

/**
 * Ekonomi analizi — full buy / force / eco tur kategorileri ve win rate'leri.
 * Ham round verisi gerektirir; Production API'den gelir.
 */
export function calcEconomy(
  rawRounds: unknown[],
  puuid: string
): EconomyStats | InsufficientData {
  if (rawRounds.length < MIN_MATCHES) return insufficient(rawRounds.length);
  return calcEconomyStats(rawRounds, puuid);
}

/**
 * Clutch performansı — 1v1'den 1v5'e kadar senaryo bazlı kazanma oranları.
 * Ham round verisi ve harita adı gerektirir.
 */
export function calcClutch(
  rawRounds: unknown[],
  puuid: string,
  map: string
): ClutchStats | InsufficientData {
  if (rawRounds.length < MIN_MATCHES) return insufficient(rawRounds.length);
  return calcClutchStats(rawRounds, puuid, map);
}

/**
 * Ajan bazlı performans — her ajan için oynanan maç, win rate, ACS, K/D.
 */
export function calcAgentPerformance(
  matches: TransformedMatch[],
  name: string,
  tag: string
): AgentStat[] | InsufficientData {
  if (matches.length < MIN_MATCHES) return insufficient(matches.length);
  return processStats(matches, name, tag).agents;
}

/**
 * Tilt skoru — son 5 maç win rate, K/D trendi ve ACS ortalamasından 0–100 arası skor.
 */
export function calcTilt(
  matches: TransformedMatch[],
  name: string,
  tag: string
): TiltStats | InsufficientData {
  if (matches.length < MIN_MATCHES) return insufficient(matches.length);
  return calcTiltStats(matches, name, tag);
}

/**
 * Duo sinerji — birlikte oynanan oyuncularla win rate ve sinerji skoru.
 */
export function calcDuo(
  matches: TransformedMatch[],
  name: string,
  tag: string
): DuoPartner[] | InsufficientData {
  if (matches.length < MIN_MATCHES) return insufficient(matches.length);
  return calcDuoSynergy(matches, name, tag);
}
