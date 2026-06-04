// Valorant rank tier numaraları — HenrikDev ve Riot API'den gelen değerler
// Tier 0 = Unranked, 3-5 = Iron, 6-8 = Bronze ... 24-26 = Immortal, 27 = Radiant
const UUID = "03621f52-342b-cf4e-4f86-9350a49c6d04";

export const RANK_MAP: Record<number, { name: string; color: string }> = {
  0:  { name: "Unranked",     color: "#9b9b9b" },
  1:  { name: "Unranked",     color: "#9b9b9b" },
  2:  { name: "Unranked",     color: "#9b9b9b" },
  3:  { name: "Iron 1",       color: "#8d6e63" },
  4:  { name: "Iron 2",       color: "#8d6e63" },
  5:  { name: "Iron 3",       color: "#8d6e63" },
  6:  { name: "Bronze 1",     color: "#cd7f32" },
  7:  { name: "Bronze 2",     color: "#cd7f32" },
  8:  { name: "Bronze 3",     color: "#cd7f32" },
  9:  { name: "Silver 1",     color: "#a8a9ad" },
  10: { name: "Silver 2",     color: "#a8a9ad" },
  11: { name: "Silver 3",     color: "#a8a9ad" },
  12: { name: "Gold 1",       color: "#ffd700" },
  13: { name: "Gold 2",       color: "#ffd700" },
  14: { name: "Gold 3",       color: "#ffd700" },
  15: { name: "Platinum 1",   color: "#00bcd4" },
  16: { name: "Platinum 2",   color: "#00bcd4" },
  17: { name: "Platinum 3",   color: "#00bcd4" },
  18: { name: "Diamond 1",    color: "#b39ddb" },
  19: { name: "Diamond 2",    color: "#b39ddb" },
  20: { name: "Diamond 3",    color: "#b39ddb" },
  21: { name: "Ascendant 1",  color: "#4caf50" },
  22: { name: "Ascendant 2",  color: "#4caf50" },
  23: { name: "Ascendant 3",  color: "#4caf50" },
  24: { name: "Immortal 1",   color: "#e05c5c" },
  25: { name: "Immortal 2",   color: "#e05c5c" },
  26: { name: "Immortal 3",   color: "#e05c5c" },
  27: { name: "Radiant",      color: "#ffe082" },
};

export function getRankIcon(tier: number): string {
  if (tier === 1 || tier === 2) tier = 0;
  return `https://media.valorant-api.com/competitivetiers/${UUID}/${tier}/largeicon.png`;
}

export function getRankInfo(tier: number) {
  return RANK_MAP[tier] ?? RANK_MAP[0];
}
