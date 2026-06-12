// ApiGateway — HenrikDev API üzerinden Valorant verisi çeker
import axios from "axios";
import { transformPlayer, transformMatch, type TransformedPlayer, type TransformedMatch } from "@/lib/transformer";
import { buildKey, cacheManagerGet, cacheManagerSet, TTL_TABLE } from "@/lib/cache/cache-manager";

const BASE = "https://api.henrikdev.xyz/valorant";
const KEY  = process.env.HENRIK_API_KEY ?? "";

export interface ProfileResult {
  player:   TransformedPlayer;
  matches:  TransformedMatch[];
  cached:   boolean;
  stale?:   boolean;
  warning?: string;
}

export interface LeaderboardResult {
  players:    unknown[];
  region:     string;
  page:       number;
  total:      number;
  lastUpdate: string | null;
}

export interface ApiError {
  error:       string;
  status:      number;
  retryAfter?: number;
}

export function buildApiError(err: unknown): ApiError {
  const e = err as { response?: { status?: number }; status?: number; retryAfter?: number };
  const s = e.response?.status ?? e.status ?? 500;
  const messages: Record<number, string> = {
    400: "Geçersiz istek parametresi.",
    401: "API key geçersiz.",
    403: "Profil gizli veya erişim engellendi.",
    404: "Oyuncu bulunamadı. Nick#Tag formatını kontrol edin.",
    429: "API rate limit aşıldı. Lütfen bekleyin.",
    500: "Sunucu hatası. Lütfen tekrar deneyin.",
  };
  return {
    error:      messages[s] ?? "Bilinmeyen hata.",
    status:     s,
    retryAfter: s === 429 ? (e.retryAfter ?? 90) : undefined,
  };
}

// ── Direkt HenrikDev çağrısı — response.data.data döndürür ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function henrik(path: string): Promise<any> {
  const res = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: KEY },
    timeout: 15000,
  });
  // HenrikDev her zaman { status, data: {...} } döndürür
  // res.data = { status: 200, data: { ... } }
  // Biz iç data'yı döndürüyoruz
  return res.data?.data ?? res.data;
}

// ── Oyuncu profili ────────────────────────────────────────────────────────────
export async function getProfile(name: string, tag: string): Promise<ProfileResult> {
  const cleanName = name.trim().slice(0, 64);
  const cleanTag  = tag.trim().slice(0, 16);
  if (!cleanName || !cleanTag) throw Object.assign(new Error("Geçersiz parametre"), { status: 400 });
  if (/[<>"'`\\;{}]/.test(cleanName) || /[<>"'`\\;{}]/.test(cleanTag)) {
    throw Object.assign(new Error("Geçersiz karakter"), { status: 400 });
  }

  const cacheKey = buildKey("profile", cleanName, cleanTag);
  
  // 1. Redis Cache Check (Ultra-fast in-memory)
  const cached = await cacheManagerGet<ProfileResult>(cacheKey);
  if (cached) return { ...cached, cached: true };

  // 2. Prisma Database Check (0ms SWR)
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbPlayer = await prisma.player.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" }, tag: { equals: cleanTag, mode: "insensitive" } },
    });

    if (dbPlayer) {
      console.log(`[ApiGateway] SWR: Prisma DB hit for ${dbPlayer.name}#${dbPlayer.tag}`);
      const fp: TransformedPlayer = {
        puuid: dbPlayer.puuid, name: dbPlayer.name, tag: dbPlayer.tag,
        level: dbPlayer.level, region: dbPlayer.region,
        card: { small: dbPlayer.cardSmall, large: dbPlayer.cardSmall, wide: dbPlayer.cardSmall },
        rank: dbPlayer.tier > 0 ? {
          tier: dbPlayer.tier, name: dbPlayer.tierName, rr: dbPlayer.rr,
          elo: dbPlayer.elo, rrChange: dbPlayer.rrChange,
          iconUrl: dbPlayer.rankIconUrl, color: "#ffffff",
          peak: { tier: dbPlayer.tier, name: dbPlayer.tierName, iconUrl: dbPlayer.rankIconUrl },
        } : null,
      };

      const result: ProfileResult = { player: fp, matches: [], cached: true, stale: false };
      
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const ageMs = Date.now() - dbPlayer.updatedAt.getTime();

      if (ageMs < ONE_DAY_MS) {
        // Data is fresh (< 24h)
        cacheManagerSet(cacheKey, result, TTL_TABLE.profile).catch(console.error);
        return result;
      } else {
        // Data is stale (> 24h). Trigger background fetch.
        console.log(`[ApiGateway] SWR: Data for ${cleanName}#${cleanTag} is stale. Triggering background refresh...`);
        result.stale = true;
        result.warning = "Stale data. Refreshing in background...";
        
        // Fire and forget (Next.js serverless environment compatible)
        fetchProfileDirect(cleanName, cleanTag)
          .then(profile => {
             cacheManagerSet(cacheKey, profile, TTL_TABLE.profile).catch(console.error);
             upsertPlayerBackground(profile.player);
          })
          .catch(err => console.error("[ApiGateway] SWR Background fetch failed:", err.message));

        // Populate Redis with stale data to avoid DB hammering
        cacheManagerSet(cacheKey, result, TTL_TABLE.profile).catch(console.error);
        return result;
      }
    }
  } catch (dbErr) {
    console.error("[ApiGateway] DB read error:", dbErr);
  }

  // 3. Not in DB at all (New Player) -> Fetch Live
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[ApiGateway] SWR: Missing in DB. Fetching live for ${cleanName}#${cleanTag}`);
      const profile = await fetchProfileDirect(cleanName, cleanTag);
      cacheManagerSet(cacheKey, profile, TTL_TABLE.profile).catch(console.error);
      upsertPlayerBackground(profile.player);
      return { ...profile, cached: false };
    } catch (err) {
      lastErr = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      console.error(`[ApiGateway] Deneme ${attempt + 1}/3 başarısız - ${cleanName}#${cleanTag}, Status: ${status}`);
      if (status === 429 && attempt < 2) { await sleep(2000); continue; }
      if (status === 500 && attempt < 1) { await sleep(1000); continue; }
      break;
    }
  }

  throw lastErr;
}

// ── Direkt HenrikDev profil çekimi ───────────────────────────────────────────
async function fetchProfileDirect(name: string, tag: string): Promise<ProfileResult> {
  const n = encodeURIComponent(name);
  const t = encodeURIComponent(tag);

  try {
    // 1. Account bilgisi — v1 card URL'lerini, level'ı verir
    // henrik() zaten res.data.data döndürüyor
    const account = await henrik(`/v1/account/${n}/${t}`);

    if (!account?.puuid) {
      console.error(`[ApiGateway] Hesap bilgisi alınamadı: ${name}#${tag}`);
      throw Object.assign(new Error("Oyuncu bulunamadı"), { status: 404 });
    }

    const region: string = account.region ?? "eu";
    console.log(`[ApiGateway] Hesap bulundu: ${account.name}#${account.tag}, Region: ${region}, PUUID: ${account.puuid}`);

    // 2. Rank + Maçlar paralel
    const [rankResult, matchesResult] = await Promise.allSettled([
      henrik(`/v2/mmr/${region}/${n}/${t}`),
      henrik(`/v3/matches/${region}/${n}/${t}?size=10`),
    ]);

    const rankData    = rankResult.status    === "fulfilled" ? rankResult.value    : null;
    const matchesData = matchesResult.status === "fulfilled" ? matchesResult.value : [];

    if (rankResult.status === "rejected") {
      console.warn("[ApiGateway] Rank alınamadı:", (rankResult.reason as Error)?.message);
    }
    if (matchesResult.status === "rejected") {
      console.warn("[ApiGateway] Maçlar alınamadı:", (matchesResult.reason as Error)?.message);
    }

    // account zaten { puuid, name, tag, account_level, region, card: { small, large, wide } }
    const player  = transformPlayer(account, rankData);
    const matches = Array.isArray(matchesData) ? matchesData.map(transformMatch) : [];

    return { player, matches, cached: false };
  } catch (err) {
    console.error(`[ApiGateway] fetchProfileDirect hatası - ${name}#${tag}:`, err);
    throw err;
  }
}

// ── Maç geçmişi ───────────────────────────────────────────────────────────────
export async function fetchMatches(name: string, tag: string, size = 10): Promise<TransformedMatch[]> {
  const key    = buildKey("matches", name, tag);
  const cached = await cacheManagerGet<TransformedMatch[]>(key);
  if (cached) return cached;

  const n       = encodeURIComponent(name);
  const t       = encodeURIComponent(tag);
  const account = await henrik(`/v1/account/${n}/${t}`);
  const region  = account?.region ?? "eu";
  const raw     = await henrik(`/v3/matches/${region}/${n}/${t}?size=${size}`);
  const matches = Array.isArray(raw) ? raw.map(transformMatch) : [];

  await cacheManagerSet(key, matches, TTL_TABLE.matches);
  return matches;
}

// ── Tek maç detayı ────────────────────────────────────────────────────────────
export async function fetchMatchDetail(matchId: string): Promise<TransformedMatch> {
  const key    = `match:${matchId}`;
  const cached = await cacheManagerGet<TransformedMatch>(key);
  if (cached) return cached;

  const raw   = await henrik(`/v2/match/${matchId}`);
  const match = transformMatch(raw);
  await cacheManagerSet(key, match, TTL_TABLE.matchDetail);
  return match;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export async function fetchLeaderboard(region: string, page = 1): Promise<LeaderboardResult> {
  const key    = `leaderboard:${region}:${page}`;
  const cached = await cacheManagerGet<LeaderboardResult>(key);
  if (cached) return cached;

  const size  = 50;
  const start = (page - 1) * size;
  const raw   = await henrik(`/v2/leaderboard/${region}?start=${start}&size=${size}`);

  const result: LeaderboardResult = {
    players:    raw?.players    ?? [],
    region,
    page,
    total:      raw?.total_players ?? 0,
    lastUpdate: raw?.last_update   ?? null,
  };

  await cacheManagerSet(key, result, TTL_TABLE.leaderboard);
  return result;
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function upsertPlayerBackground(player: TransformedPlayer): void {
  (async () => {
    try {
      const { prisma } = await import("@/lib/prisma");
      const elo = player.rank?.elo ?? 0;
      console.log(`[ApiGateway] DB'ye kaydediliyor: ${player.name}#${player.tag}, ELO: ${elo}`);
      await prisma.player.upsert({
        where:  { puuid: player.puuid },
        update: {
          name: player.name, tag: player.tag, region: player.region,
          level: player.level, cardSmall: player.card?.small ?? "",
          tier: player.rank?.tier ?? 0, tierName: player.rank?.name ?? "Unranked",
          elo, rr: player.rank?.rr ?? 0,
          rrChange: player.rank?.rrChange ?? 0, rankIconUrl: player.rank?.iconUrl ?? "",
        },
        create: {
          puuid: player.puuid, name: player.name, tag: player.tag,
          region: player.region, level: player.level, cardSmall: player.card?.small ?? "",
          tier: player.rank?.tier ?? 0, tierName: player.rank?.name ?? "Unranked",
          elo, rr: player.rank?.rr ?? 0,
          rrChange: player.rank?.rrChange ?? 0, rankIconUrl: player.rank?.iconUrl ?? "",
        },
      });
      console.log(`[ApiGateway] DB'ye başarıyla kaydedildi: ${player.name}#${player.tag}`);
    } catch (e) {
      console.error(`[ApiGateway] DB upsert başarısız - ${player.name}#${player.tag}:`, e);
    }
  })();
}

// ── Eski hGet export'u — geriye dönük uyumluluk ───────────────────────────────
export async function hGet(path: string): Promise<unknown> {
  const res = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: KEY },
    timeout: 15000,
  });
  return res.data;
}
