// Maç verisinden performans öngörüleri üretir
// Oyuncu performans içgörüleri — maç geçmişi ve trend analizi

export interface PerformanceInsight {
  label: string;
  color: "green" | "blue" | "yellow" | "red" | "purple";
  emoji: string;
}

interface InsightInput {
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  acs: number;
  adr: number;
  won: boolean;
}

export function getMatchInsights(p: InsightInput): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  const totalShots = p.headshots + p.bodyshots + p.legshots || 1;
  const hsRate = Math.round((p.headshots / totalShots) * 100);
  const kd = p.deaths > 0 ? p.kills / p.deaths : p.kills;

  // Headshot oranı
  if (hsRate >= 40) {
    insights.push({ label: "Keskin Nişancı", color: "yellow", emoji: "🎯" });
  } else if (hsRate >= 25) {
    insights.push({ label: "İyi Aim", color: "blue", emoji: "🔵" });
  }

  // K/D oranı
  if (kd >= 2.5) {
    insights.push({ label: "Dominant Performans", color: "purple", emoji: "👑" });
  } else if (kd >= 1.5) {
    insights.push({ label: "Güçlü K/D", color: "green", emoji: "⚡" });
  } else if (kd < 0.7) {
    insights.push({ label: "Zor Maç", color: "red", emoji: "💪" });
  }

  // ACS
  if (p.acs >= 300) {
    insights.push({ label: "Yüksek Etki", color: "purple", emoji: "🔥" });
  } else if (p.acs >= 200) {
    insights.push({ label: "Tutarlı Oyun", color: "green", emoji: "✅" });
  }

  // ADR
  if (p.adr >= 180) {
    insights.push({ label: "Hasar Makinesi", color: "red", emoji: "💥" });
  }

  // Assist odaklı oyun
  if (p.assists >= 8) {
    insights.push({ label: "Takım Oyuncusu", color: "blue", emoji: "🤝" });
  }

  return insights.slice(0, 2); // max 2 badge göster
}

export const INSIGHT_COLORS: Record<PerformanceInsight["color"], string> = {
  green:  "bg-green-500/15 text-green-400 border-green-500/20",
  blue:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  red:    "bg-red-500/15 text-red-400 border-red-500/20",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};
