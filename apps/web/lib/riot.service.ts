/**
 * Riot Official API Service
 * Docs: https://developer.riotgames.com/docs/valorant
 *
 * Routing:
 *  - Account lookup  → europe.api.riotgames.com  (any region works for account-v1)
 *  - Match/Ranked    → {region}.api.riotgames.com (eu / na / ap / kr / br / latam)
 */
import axios, { AxiosError } from "axios";

const RIOT_KEY = process.env.RIOT_API_KEY ?? "";

// Valorant agent UUID → display name + icon (from valorant-api.com CDN, no auth needed)
const AGENT_CDN = "https://valorant-api.com/v1/agents";
let _agentCache: Record<string, { name: string; icon: string }> | null = null;

async function getAgentMap(): Promise<Record<string, { name: string; icon: string }>> {
  if (_agentCache) return _agentCache;
  try {
    const res = await axios.get(`${AGENT_CDN}?isPlayableCharacter=true`, { timeout: 8000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _agentCache = Object.fromEntries(res.data.data.map((a: any) => [
      a.uuid.toLowerCase(),
      { name: a.displayName as string, icon: a.displayIcon as string },
    ]));
  } catch {
    _agentCache = {};
  }
  return _agentCache!;
}

// Weapon UUID → display name (from valorant-api.com)
const WEAPON_CDN = "https://valorant-api.com/v1/weapons";
let _weaponCache: Record<string, string> | null = null;

async function getWeaponMap(): Promise<Record<string, string>> {
  if (_weaponCache) return _weaponCache;
  try {
    const res = await axios.get(WEAPON_CDN, { timeout: 8000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _weaponCache = Object.fromEntries(res.data.data.map((w: any) => [
      w.uuid.toLowerCase(), w.displayName as string,
    ]));
  } catch {
    _weaponCache = {};
  }
  return _weaponCache!;
}

// Map UUID → display name
const MAP_CDN = "https://valorant-api.com/v1/maps";
let _mapCache: Record<string, string> | null = null;

async function getMapName(mapId: string): Promise<string> {
  if (!_mapCache) {
    try {
      const res = await axios.get(MAP_CDN, { timeout: 8000 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _mapCache = Object.fromEntries(res.data.data.map((m: any) => [
        (m.mapUrl as string).toLowerCase(), m.displayName as string,
      ]));
    } catch { _mapCache = {}; }
  }
  return _mapCache![mapId.toLowerCase()] ?? mapId.split("/").pop() ?? mapId;
}

function riotHeaders() {
  return { "X-Riot-Token": RIOT_KEY };
}

function accountBase() {
  return "https://europe.api.riotgames.com";
}

function gameBase(region: string) {
  // Riot uses: na, eu, ap, kr, br, latam
  const r = region.toLowerCase();
  return `https://${r}.api.riotgames.com`;
}

export class RiotApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function handleAxiosError(e: unknown): never {
  const err = e as AxiosError;
  const status = err.response?.status ?? 500;
  if (status === 404) throw new RiotApiError(404, "Oyuncu bulunamadı.");
  if (status === 429) throw new RiotApiError(429, "API rate limit aşıldı. Lütfen bekleyin.");
  if (status === 403) throw new RiotApiError(403, "API key geçersiz veya yetkisiz.");
  if (status === 401) throw new RiotApiError(401, "API key eksik.");
  throw new RiotApiError(status, "Riot API hatası.");
}

// ── Step 1: Account by Riot ID ──────────────────────────────────────────────
export async function getAccountByRiotId(gameName: string, tagLine: string) {
  try {
    const res = await axios.get(
      `${accountBase()}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: riotHeaders(), timeout: 10000 }
    );
    return res.data as { puuid: string; gameName: string; tagLine: string };
  } catch (e) { handleAxiosError(e); }
}

// ── Step 2: Active shard (region) for VALORANT ─────────────────────────────
export async function getActiveShard(puuid: string): Promise<string> {
  try {
    const res = await axios.get(
      `${accountBase()}/riot/account/v1/active-shards/by-game/val/by-puuid/${puuid}`,
      { headers: riotHeaders(), timeout: 10000 }
    );
    return (res.data.activeShard as string) ?? "eu";
  } catch {
    return "eu"; // fallback
  }
}

// ── Step 3: Match list ──────────────────────────────────────────────────────
export async function getMatchList(puuid: string, region: string, count = 10) {
  try {
    const res = await axios.get(
      `${gameBase(region)}/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers: riotHeaders(), timeout: 10000 }
    );
    const history = (res.data.history ?? []) as { matchId: string; gameStartTime: number; teamId: string }[];
    return history.slice(0, count);
  } catch (e) { handleAxiosError(e); }
}

// ── Step 4: Match details (parallel) ───────────────────────────────────────
export async function getMatchDetails(matchIds: string[], region: string) {
  const results = await Promise.allSettled(
    matchIds.map(id =>
      axios.get(`${gameBase(region)}/val/match/v1/matches/${id}`, {
        headers: riotHeaders(), timeout: 15000,
      })
    )
  );
  return results
    .filter(r => r.status === "fulfilled")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(r => (r as PromiseFulfilledResult<any>).value.data);
}

// ── Step 5: Ranked leaderboard (act-based, no individual rank in official API)
// Official API doesn't expose individual player rank — we use competitiveTier from match data
// ────────────────────────────────────────────────────────────────────────────

// ── Full player profile fetch chain ────────────────────────────────────────
export async function fetchPlayerProfile(gameName: string, tagLine: string) {
  const account = await getAccountByRiotId(gameName, tagLine);
  const region  = await getActiveShard(account.puuid);
  const matchList = await getMatchList(account.puuid, region, 10);
  const matchIds  = matchList.map(m => m.matchId);
  const matches   = await getMatchDetails(matchIds, region);
  const [agents, weapons] = await Promise.all([getAgentMap(), getWeaponMap()]);

  return { account, region, matches, agents, weapons };
}

export { getAgentMap, getWeaponMap, getMapName };
