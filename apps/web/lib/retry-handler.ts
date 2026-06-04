// RetryHandler — başarısız API isteklerini yeniden dener ve fallback zinciri uygular
// Fallback sırası: retry → Redis stale → MongoDB son kayıt → { error, retryAfter }

import { cacheGet } from "@/lib/redis";

export interface RetryConfig {
  maxAttempts: number;
  delayMs:     number;
  retryOn:     number[]; // HTTP status kodları
}

export interface FallbackResult {
  data:    unknown;
  stale:   true;
  warning: string;
}

const RETRY_CONFIGS: Record<number, RetryConfig> = {
  429: { maxAttempts: 2, delayMs: 2000, retryOn: [429] },
  500: { maxAttempts: 1, delayMs: 1000, retryOn: [500] },
};

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function getStatusFromError(err: unknown): number {
  return (err as { response?: { status?: number } })?.response?.status ?? 500;
}

/**
 * Verilen async fonksiyonu retry + fallback zinciriyle çalıştırır.
 * @param fn - Çalıştırılacak async fonksiyon
 * @param cacheKey - Stale veri için Redis anahtarı (opsiyonel)
 * @param dbQuery - MongoDB fallback sorgusu (opsiyonel)
 * @param url - Log için URL etiketi
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  cacheKey?: string,
  dbQuery?: () => Promise<unknown>,
  url = "unknown"
): Promise<T | FallbackResult> {
  let lastStatus = 500;

  // Retry döngüsü
  for (const [statusStr, config] of Object.entries(RETRY_CONFIGS)) {
    const targetStatus = parseInt(statusStr);
    let attempt = 0;

    while (attempt <= config.maxAttempts) {
      try {
        return await fn();
      } catch (err) {
        lastStatus = getStatusFromError(err);
        if (!config.retryOn.includes(lastStatus)) break;

        attempt++;
        if (attempt <= config.maxAttempts) {
          console.warn(`[RetryHandler] attempt ${attempt}/${config.maxAttempts}: ${url} (${lastStatus})`);
          await sleep(config.delayMs);
        }
      }
    }

    if (lastStatus !== targetStatus) break;
  }

  // Fallback 1: Redis stale veri
  if (cacheKey) {
    try {
      const stale = await cacheGet<T>(cacheKey);
      if (stale) {
        return {
          data:    stale,
          stale:   true,
          warning: "Sistem yoğun, önbellekten yüklendi. Veri güncel olmayabilir.",
        };
      }
    } catch { /* devam */ }
  }

  // Fallback 2: MongoDB son kayıt
  if (dbQuery) {
    try {
      const dbData = await dbQuery();
      if (dbData) {
        return {
          data:    dbData,
          stale:   true,
          warning: "Sistem yoğun, veritabanından yüklendi. Veri güncel olmayabilir.",
        };
      }
    } catch { /* devam */ }
  }

  // Fallback 3: Hata yanıtı
  const retryAfter = lastStatus === 429 ? 90 : 30;
  throw Object.assign(
    new Error("Servis geçici olarak kullanılamıyor."),
    { status: lastStatus, retryAfter }
  );
}
