// CacheManager — Redis-first, in-memory fallback
// Tüm TTL değerleri tek yerden yönetilir; hiçbir zaman exception fırlatmaz
import { cacheGet, cacheSet } from "@/lib/redis";

/** Her veri tipi için saniye cinsinden TTL değerleri */
export const TTL_TABLE = {
  matches:      600,   // maç geçmişi — 10 dakika
  mmr:          300,   // rank/MMR — 5 dakika
  leaderboard:  180,   // leaderboard — 3 dakika
  matchDetail:  7200,  // tek maç detayı — 2 saat
  profile:      600,   // oyuncu + maçlar birleşik — 10 dakika
  devlog:       3600,  // devlog listesi — 1 saat
  rateLimit429: 120,   // 429 hata yanıtı — 2 dakika
} as const;

export type CacheKey = keyof typeof TTL_TABLE;

/**
 * Önbellek anahtarı oluşturur.
 * Format: `{type}:{name}:{tag}` — tümü küçük harfe normalize edilir.
 */
export function buildKey(type: CacheKey, name: string, tag: string): string {
  return `${type}:${name.toLowerCase()}:${tag.toLowerCase()}`;
}

/**
 * Önbellekten veri okur. Bulunamazsa null döner; asla exception fırlatmaz.
 */
export async function cacheManagerGet<T>(key: string): Promise<T | null> {
  try {
    return await cacheGet<T>(key);
  } catch {
    return null;
  }
}

/**
 * Veriyi önbelleğe yazar. TTL_TABLE'dan alınan süreyle saklar; asla exception fırlatmaz.
 */
export async function cacheManagerSet(
  key: string,
  data: unknown,
  ttl: number
): Promise<void> {
  try {
    await cacheSet(key, data, ttl);
  } catch {
    // sessizce yut — önbellek yazma hatası kritik değil
  }
}

/**
 * Belirli bir anahtarı önbellekten siler (TTL=1 ile üzerine yazar).
 */
export async function cacheManagerInvalidate(key: string): Promise<void> {
  try {
    await cacheSet(key, null, 1);
  } catch {
    // sessizce yut
  }
}
