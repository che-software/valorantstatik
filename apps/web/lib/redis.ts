import Redis from "ioredis";

// Redis yoksa in-memory fallback kullan
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 2000, maxRetriesPerRequest: 1 });
      redis.on("error", () => { redis = null; });
    } catch { redis = null; }
  }
  return redis;
}

// In-memory fallback
const memCache = new Map<string, { data: string; exp: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (r) {
      const val = await r.get(key);
      return val ? JSON.parse(val) : null;
    }
  } catch { /* fallback */ }
  const hit = memCache.get(key);
  if (hit && hit.exp > Date.now()) return JSON.parse(hit.data) as T;
  return null;
}

export async function cacheSet(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
  const str = JSON.stringify(data);
  try {
    const r = getRedis();
    if (r) { await r.setex(key, ttlSeconds, str); return; }
  } catch { /* fallback */ }
  memCache.set(key, { data: str, exp: Date.now() + ttlSeconds * 1000 });
}
