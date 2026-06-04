// Mock data — test ve UI geliştirme için örnek oyuncu/maç verisi (production verisi değildir)

import { TransformedPlayer, TransformedMatch } from "./transformer";
import { getRankIcon, getRankInfo } from "./rank-map";

export const MOCK_PLAYER: TransformedPlayer = {
  puuid: "mock-puuid-0000",
  name: "KediPotter",
  tag: "TR1",
  level: 187,
  region: "EU",
  card: {
    small: "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/smallart.png",
    large: "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/largeart.png",
    wide:  "https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png",
  },
  rank: {
    tier: 24,                          // 24 = Immortal 1
    name: "Immortal 1",
    rr: 67,
    elo: 2467,
    rrChange: 18,
    iconUrl: getRankIcon(24),
    color: getRankInfo(24).color,
    peak: { tier: 25, name: "Immortal 2", iconUrl: getRankIcon(25) },
  },
};

export const MOCK_MATCHES: TransformedMatch[] = [
  buildMatch("match-001", "Ascent",   "Competitive", true,  13, 7,  "Jett",    "jett",    24, "Immortal 1", 28, 6, 4, 312, 180),
  buildMatch("match-002", "Bind",     "Competitive", false, 9,  13, "Reyna",   "reyna",   24, "Immortal 1", 22, 8, 3, 245, 165),
  buildMatch("match-003", "Haven",    "Competitive", true,  13, 10, "Neon",    "neon",    24, "Immortal 1", 31, 5, 7, 298, 172),
  buildMatch("match-004", "Pearl",    "Competitive", false, 11, 13, "Chamber", "chamber", 24, "Immortal 1", 19, 9, 2, 210, 158),
  buildMatch("match-005", "Fracture", "Competitive", true,  13, 8,  "Jett",    "jett",    24, "Immortal 1", 26, 7, 5, 287, 168),
];

// Mock silah istatistikleri (WeaponTable için)
export const MOCK_WEAPONS = [
  { weapon: "Vandal",  kills: 87, headshots: 31, bodyshots: 48, legshots: 8,  hsPercent: 36 },
  { weapon: "Phantom", kills: 54, headshots: 17, bodyshots: 32, legshots: 5,  hsPercent: 31 },
  { weapon: "Sheriff", kills: 23, headshots: 14, bodyshots: 7,  legshots: 2,  hsPercent: 61 },
];

// ---- yardımcı builder ----
function buildMatch(
  matchId: string,
  map: string,
  mode: string,
  won: boolean,
  rwon: number,
  rlost: number,
  character: string,
  agentSlug: string,
  tier: number,
  tierName: string,
  kills: number,
  deaths: number,
  assists: number,
  acs: number,
  adr: number,
): TransformedMatch {
  const agentIcon = `https://media.valorant-api.com/agents/${agentSlugToUuid(agentSlug)}/displayicon.png`;
  const rounds = rwon + rlost;

  const mockPlayer = {
    puuid: "mock-puuid-0000",
    name: "KediPotter",
    tag: "TR1",
    team: "blue",
    character,
    agentIcon,
    tier,
    tierName,
    acs,
    adr,
    damageMade: adr * rounds,
    weaponKills: { Vandal: Math.round(kills * 0.6), Phantom: Math.round(kills * 0.3), Sheriff: Math.round(kills * 0.1) },
    stats: {
      kills,
      deaths,
      assists,
      score: acs * rounds,
      headshots: Math.round(kills * 0.35),
      bodyshots: Math.round(kills * 0.55),
      legshots:  Math.round(kills * 0.10),
    },
  };

  return {
    matchId,
    map,
    mode,
    duration: Math.floor(Math.random() * 15) + 30,
    rounds,
    startedAt: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 3),
    teams: {
      blue: { won, roundsWon: rwon, roundsLost: rlost },
      red:  { won: !won, roundsWon: rlost, roundsLost: rwon },
    },
    players: [mockPlayer],
  };
}

// Bilinen ajan slug → UUID eşlemesi (valorant-api.com'dan)
function agentSlugToUuid(slug: string): string {
  const map: Record<string, string> = {
    jett:    "add6443a-41bd-e414-f6ad-e58d267f4e95",
    reyna:   "a3bfb853-43b2-7238-a4f1-ad90e9e46bcc",
    neon:    "bb2a4828-46eb-8cd1-e765-15848195d751",
    chamber: "22697a3d-45bf-8dd7-4fec-84a9e28c69d7",
    phoenix: "eb93336a-449b-9c1e-0ac7-d453df2f3791",
  };
  return map[slug] ?? "add6443a-41bd-e414-f6ad-e58d267f4e95";
}
