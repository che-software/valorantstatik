// Gelişmiş istatistik modülü — 4 rakip siteden farklı özellik
// Tracker.gg'de olmayan analizler: Economy, Clutch, Tilt, Duo Synergy
import { TransformedMatch } from "./transformer";

// ─────────────────────────────────────────────
// 1. EKONOMİ ANALİZİ
// ─────────────────────────────────────────────

export interface EconomyStats {
  fullBuyRounds:    number; // 3900+ harcanan roundlar
  fullBuyWins:      number;
  fullBuyWinRate:   number; // Full buy başarı oranı
  ecoRounds:        number; // 1000 altı harcama
  ecoWins:          number;
  ecoWinRate:       number;
  forceRounds:      number; // 1000-3900 arası
  forceWins:        number;
  forceWinRate:     number;
  avgSpend:         number; // ortalama round harcaması
  overSpendRounds:  number; // takım ekonomisine rağmen fazla harcama
  supportGiven:     number; // takım arkadaşına silah verilen round sayısı
  econRating:       number; // 0-100 arası ekonomi skoru
}

export interface EconomyRound {
  roundNum:   number;
  spent:      number;
  remaining:  number;
  loadoutVal: number;
  won:        boolean;
  buyType:    "full" | "force" | "eco" | "save";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calcEconomyStats(rawRounds: any[], puuid: string): EconomyStats {
  let fullBuy = 0, fullBuyW = 0;
  let eco = 0, ecoW = 0;
  let force = 0, forceW = 0;
  let totalSpend = 0, overSpend = 0, support = 0;

  for (const round of rawRounds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pStats = round.player_stats?.find((p: any) => p.player_puuid === puuid);
    if (!pStats) continue;

    const spent    = pStats.economy?.spent ?? 0;
    const loadout  = pStats.economy?.loadout_value ?? 0;
    const won      = round.winning_team === pStats.player_team;
    totalSpend    += spent;

    // Takım ortalaması ile karşılaştır (over-spend tespiti)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamStats = round.player_stats?.filter((p: any) => p.player_team === pStats.player_team) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamAvg   = teamStats.reduce((s: number, p: any) => s + (p.economy?.spent ?? 0), 0) / (teamStats.length || 1);
    if (spent > teamAvg * 1.4 && spent > 3000) overSpend++;

    // Silah desteği: loadout değeri düşük ama iyi silah var (takımdan aldı)
    if (loadout > spent * 1.5 && spent < 1500) support++;

    if (spent >= 3900)      { fullBuy++; if (won) fullBuyW++; }
    else if (spent >= 1000) { force++;   if (won) forceW++;   }
    else                    { eco++;     if (won) ecoW++;     }
  }

  const total = fullBuy + force + eco || 1;
  // Ekonomi skoru: full buy win rate ağırlıklı, eco win rate bonus
  const econRating = Math.min(100, Math.round(
    (fullBuy > 0 ? (fullBuyW / fullBuy) * 50 : 25) +
    (eco > 0     ? (ecoW / eco) * 30 : 15)         +
    (overSpend / total < 0.1 ? 20 : 10)
  ));

  return {
    fullBuyRounds:  fullBuy,
    fullBuyWins:    fullBuyW,
    fullBuyWinRate: fullBuy > 0 ? Math.round((fullBuyW / fullBuy) * 100) : 0,
    ecoRounds:      eco,
    ecoWins:        ecoW,
    ecoWinRate:     eco > 0 ? Math.round((ecoW / eco) * 100) : 0,
    forceRounds:    force,
    forceWins:      forceW,
    forceWinRate:   force > 0 ? Math.round((forceW / force) * 100) : 0,
    avgSpend:       Math.round(totalSpend / total),
    overSpendRounds: overSpend,
    supportGiven:   support,
    econRating,
  };
}

// ─────────────────────────────────────────────
// 2. CLUTCH PERFORMANSI (1vX)
// ─────────────────────────────────────────────

export interface ClutchScenario {
  type:    "1v1" | "1v2" | "1v3" | "1v4" | "1v5";
  total:   number;
  wins:    number;
  winRate: number;
}

export interface ClutchStats {
  scenarios:    ClutchScenario[];
  totalClutches: number;
  totalWins:    number;
  overallRate:  number;
  byMap:        Record<string, { total: number; wins: number; winRate: number }>;
  clutchRating: number; // 0-100
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calcClutchStats(rawRounds: any[], puuid: string, matchMap: string): ClutchStats {
  const scenarios: Record<string, { total: number; wins: number }> = {
    "1v1": { total: 0, wins: 0 },
    "1v2": { total: 0, wins: 0 },
    "1v3": { total: 0, wins: 0 },
    "1v4": { total: 0, wins: 0 },
    "1v5": { total: 0, wins: 0 },
  };
  const byMap: Record<string, { total: number; wins: number; winRate: number }> = {};

  for (const round of rawRounds) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pStats = round.player_stats?.find((p: any) => p.player_puuid === puuid);
    if (!pStats) continue;

    const myTeam  = pStats.player_team;
    const won     = round.winning_team === myTeam;

    // Clutch tespiti: round sonunda sadece bu oyuncu hayatta, karşı takımda X kişi var
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allStats = round.player_stats ?? [] as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myTeamAlive  = allStats.filter((p: any) => p.player_team === myTeam && !p.was_afk).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enemyAlive   = allStats.filter((p: any) => p.player_team !== myTeam && !p.was_afk).length;

    // Clutch: sadece bu oyuncu hayatta (1 vs X)
    if (myTeamAlive === 1 && enemyAlive >= 1 && enemyAlive <= 5) {
      const key = `1v${enemyAlive}` as keyof typeof scenarios;
      if (scenarios[key]) {
        scenarios[key].total++;
        if (won) scenarios[key].wins++;

        if (!byMap[matchMap]) byMap[matchMap] = { total: 0, wins: 0, winRate: 0 };
        byMap[matchMap].total++;
        if (won) byMap[matchMap].wins++;
      }
    }
  }

  // byMap win rate hesapla
  for (const map of Object.keys(byMap)) {
    byMap[map].winRate = byMap[map].total > 0
      ? Math.round((byMap[map].wins / byMap[map].total) * 100)
      : 0;
  }

  const totalClutches = Object.values(scenarios).reduce((s, v) => s + v.total, 0);
  const totalWins     = Object.values(scenarios).reduce((s, v) => s + v.wins, 0);
  const overallRate   = totalClutches > 0 ? Math.round((totalWins / totalClutches) * 100) : 0;

  // Clutch rating: 1v2+ senaryolar daha değerli
  const clutchRating = Math.min(100, Math.round(
    overallRate * 0.5 +
    (scenarios["1v2"].wins * 15) +
    (scenarios["1v3"].wins * 25) +
    Math.min(25, totalClutches * 2)
  ));

  return {
    scenarios: Object.entries(scenarios).map(([type, s]) => ({
      type: type as ClutchScenario["type"],
      total: s.total,
      wins: s.wins,
      winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
    })),
    totalClutches,
    totalWins,
    overallRate,
    byMap,
    clutchRating,
  };
}

// ─────────────────────────────────────────────
// 3. TILT METRE (Mental Coach)
// ─────────────────────────────────────────────

export type TiltLevel = "fresh" | "focused" | "tilting" | "tilted" | "rest";

export interface TiltStats {
  level:          TiltLevel;
  score:          number;   // 0-100 (100 = tam dinç)
  label:          string;
  advice:         string;
  emoji:          string;
  recentWinRate:  number;   // son 5 maç
  kdTrend:        number;   // son 5 maç K/D trendi (pozitif = iyileşiyor)
  deathSpeedTrend: number;  // ölme hızı trendi (düşük = daha dikkatli)
  firstBloodRate: number;   // agresiflik göstergesi
  indicators:     string[]; // açıklayıcı maddeler
}

export function calcTiltStats(
  matches: TransformedMatch[],
  playerName: string,
  playerTag: string
): TiltStats {
  const recent = matches.slice(0, 5);
  if (recent.length === 0) {
    return { level: "focused", score: 70, label: "Veri Yok", advice: "Maç oyna!", emoji: "❓", recentWinRate: 0, kdTrend: 0, deathSpeedTrend: 0, firstBloodRate: 0, indicators: [] };
  }

  const name = playerName.toLowerCase();
  const tag  = playerTag.toLowerCase();

  let wins = 0, totalKd = 0, totalAcs = 0;
  const kdList: number[] = [];

  for (const m of recent) {
    const p = m.players.find(x => x.name.toLowerCase() === name && x.tag.toLowerCase() === tag);
    if (!p) continue;
    const team = p.team as "red" | "blue";
    if (m.teams[team]?.won) wins++;
    const kd = p.stats.deaths > 0 ? p.stats.kills / p.stats.deaths : p.stats.kills;
    totalKd  += kd;
    totalAcs += p.acs;
    kdList.push(kd);
  }

  const recentWinRate = Math.round((wins / recent.length) * 100);
  const avgKd         = totalKd / recent.length;
  const avgAcs        = totalAcs / recent.length;

  // K/D trendi: son 2 maç vs ilk 3 maç karşılaştırması
  const earlyKd  = kdList.slice(2).reduce((s, v) => s + v, 0) / (kdList.slice(2).length || 1);
  const lateKd   = kdList.slice(0, 2).reduce((s, v) => s + v, 0) / (kdList.slice(0, 2).length || 1);
  const kdTrend  = parseFloat((lateKd - earlyKd).toFixed(2));

  // Agresiflik: K/D yüksek ama win rate düşükse tilt sinyali
  const firstBloodRate = Math.min(100, Math.round(avgKd * 30));

  // Tilt skoru hesapla (100 = tam dinç)
  let score = 50;
  score += recentWinRate > 50 ? 20 : recentWinRate > 30 ? 5 : -15;
  score += avgKd > 1.5 ? 15 : avgKd > 1.0 ? 5 : -10;
  score += kdTrend > 0.2 ? 10 : kdTrend < -0.3 ? -15 : 0;
  score += avgAcs > 220 ? 10 : avgAcs < 150 ? -10 : 0;
  score  = Math.max(0, Math.min(100, score));

  // Tilt seviyesi
  let level: TiltLevel;
  let label: string, advice: string, emoji: string;
  const indicators: string[] = [];

  if (score >= 75) {
    level = "fresh"; label = "Zirvede"; emoji = "🔥";
    advice = "Harika gidiyorsun! Bu formu koru.";
  } else if (score >= 55) {
    level = "focused"; label = "Odaklanmış"; emoji = "✅";
    advice = "İyi bir ritimdesin. Devam et.";
  } else if (score >= 35) {
    level = "tilting"; label = "Dikkat Et"; emoji = "⚠️";
    advice = "Performansın düşüyor. Kısa bir mola ver.";
  } else if (score >= 20) {
    level = "tilted"; label = "Tilt Modunda"; emoji = "😤";
    advice = "Şu an tilt halinde görünüyorsun. 30 dakika mola önerilir.";
  } else {
    level = "rest"; label = "Dinlenme Zamanı"; emoji = "😴";
    advice = "Bugün yeter! Yarın daha iyi oynarsın.";
  }

  if (recentWinRate < 30) indicators.push(`Son ${recent.length} maçta %${recentWinRate} kazanma oranı`);
  if (kdTrend < -0.3)     indicators.push("K/D oranın düşüş trendinde");
  if (avgAcs < 150)       indicators.push("Ortalama ACS düşük (< 150)");
  if (recentWinRate > 60) indicators.push(`Son ${recent.length} maçta %${recentWinRate} kazanma oranı 🔥`);
  if (kdTrend > 0.2)      indicators.push("K/D oranın yükseliş trendinde ⬆️");

  return {
    level, score, label, advice, emoji,
    recentWinRate,
    kdTrend,
    deathSpeedTrend: kdTrend * -1, // ters korelasyon
    firstBloodRate,
    indicators,
  };
}

// ─────────────────────────────────────────────
// 4. DUO/TRIO SYNERJİSİ
// ─────────────────────────────────────────────

export interface DuoPartner {
  name:       string;
  tag:        string;
  gamesPlayed: number;
  wins:       number;
  winRate:    number;
  avgKdTogether: number;
  bestMap:    string;
  bestMapWinRate: number;
  synergyScore: number; // 0-100
}

export function calcDuoSynergy(
  matches: TransformedMatch[],
  playerName: string,
  playerTag: string
): DuoPartner[] {
  const name = playerName.toLowerCase();
  const tag  = playerTag.toLowerCase();

  // partner_key → { games, wins, kdSum, mapWins: {map: {w,t}} }
  const partnerMap: Record<string, {
    name: string; tag: string;
    games: number; wins: number; kdSum: number;
    mapData: Record<string, { wins: number; total: number }>;
  }> = {};

  for (const match of matches) {
    const me = match.players.find(p => p.name.toLowerCase() === name && p.tag.toLowerCase() === tag);
    if (!me) continue;

    const myTeam = me.team as "red" | "blue";
    const won    = match.teams[myTeam]?.won ?? false;
    const myKd   = me.stats.deaths > 0 ? me.stats.kills / me.stats.deaths : me.stats.kills;

    // Aynı takımdaki oyuncular = potansiyel duo
    const teammates = match.players.filter(
      p => p.team === myTeam &&
           !(p.name.toLowerCase() === name && p.tag.toLowerCase() === tag)
    );

    for (const tm of teammates) {
      const key = `${tm.name.toLowerCase()}#${tm.tag.toLowerCase()}`;
      if (!partnerMap[key]) {
        partnerMap[key] = { name: tm.name, tag: tm.tag, games: 0, wins: 0, kdSum: 0, mapData: {} };
      }
      partnerMap[key].games++;
      if (won) partnerMap[key].wins++;
      partnerMap[key].kdSum += myKd;

      const mapKey = match.map;
      if (!partnerMap[key].mapData[mapKey]) partnerMap[key].mapData[mapKey] = { wins: 0, total: 0 };
      partnerMap[key].mapData[mapKey].total++;
      if (won) partnerMap[key].mapData[mapKey].wins++;
    }
  }

  return Object.values(partnerMap)
    .filter(p => p.games >= 2) // en az 2 maç birlikte
    .map(p => {
      const winRate = Math.round((p.wins / p.games) * 100);
      const avgKd   = parseFloat((p.kdSum / p.games).toFixed(2));

      // En iyi harita
      let bestMap = "—", bestMapWinRate = 0;
      for (const [map, data] of Object.entries(p.mapData)) {
        const wr = data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0;
        if (wr > bestMapWinRate) { bestMap = map; bestMapWinRate = wr; }
      }

      // Sinerji skoru
      const synergyScore = Math.min(100, Math.round(
        winRate * 0.5 +
        Math.min(30, p.games * 5) +
        (avgKd > 1.5 ? 20 : avgKd > 1.0 ? 10 : 0)
      ));

      return { name: p.name, tag: p.tag, gamesPlayed: p.games, wins: p.wins, winRate, avgKdTogether: avgKd, bestMap, bestMapWinRate, synergyScore };
    })
    .sort((a, b) => b.synergyScore - a.synergyScore)
    .slice(0, 5);
}
