/**
 * Riot Production API anahtarı için tipik üst sınırlar (geliştirici portalındaki ürün kotasına göre
 * `RIOT_RGAPI_*` ile özelleştirin): çoğu ürün için ~20 istek/s ve ~100 istek/120s bandı raporlanır.
 * Burada güvenli marj: saniyelik ve 2 dakikalık pencereler birlikte uygulanır.
 *
 * Not: Sunucusuz (serverless) ortamda bellek içi sayaçlar örnek başına ayrıdır; küresel kota için Redis önerilir.
 */

/** Token bucket — kısa süreli patlamaları yumuşatır */
export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryAcquire(cost = 1): number {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerMs);
      this.lastRefill = now;
    }
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return 0;
    }
    const missing = cost - this.tokens;
    return Math.max(1, Math.ceil(missing / this.refillPerMs));
  }

  async acquire(cost = 1): Promise<void> {
    for (;;) {
      const wait = this.tryAcquire(cost);
      if (wait === 0) return;
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/** Kaydırımlı pencere — son `windowMs` içinde en fazla `max` istek */
export class SlidingWindowLogLimiter {
  private log: number[] = [];

  constructor(
    private readonly max: number,
    private readonly windowMs: number
  ) {}

  async acquire(): Promise<void> {
    for (;;) {
      const now = Date.now();
      const cut = now - this.windowMs;
      this.log = this.log.filter(t => t > cut);
      if (this.log.length < this.max) {
        this.log.push(now);
        return;
      }
      const oldest = this.log[0]!;
      const wait = Math.min(60_000, Math.max(5, oldest + this.windowMs - now + 15));
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

export interface RiotOutboundLimiter {
  acquire(): Promise<void>;
}

/** RGAPI (X-Riot-Token) giden çağrılar — saniye + 2 dk penceresi */
export function createRiotKeyOutboundLimiter(): RiotOutboundLimiter {
  const perSec = Math.max(1, Number(process.env.RIOT_RGAPI_MAX_PER_SECOND ?? 18));
  const burst = Math.max(perSec, Number(process.env.RIOT_RGAPI_BURST ?? 18));
  const bucket = new TokenBucketRateLimiter(burst, perSec / 1000);
  const max2m = Math.max(1, Number(process.env.RIOT_RGAPI_MAX_PER_2MIN ?? 95));
  const win2m = Math.max(30_000, Number(process.env.RIOT_RGAPI_2MIN_WINDOW_MS ?? 120_000));
  const sliding = new SlidingWindowLogLimiter(max2m, win2m);
  return {
    async acquire() {
      await bucket.acquire(1);
      await sliding.acquire();
    },
  };
}

let sharedOutbound: RiotOutboundLimiter | null = null;

export function getSharedRiotKeyOutboundLimiter(): RiotOutboundLimiter {
  if (!sharedOutbound) sharedOutbound = createRiotKeyOutboundLimiter();
  return sharedOutbound;
}

/** Geriye dönük: yalnızca token bucket */
export function createRgapiLimiterFromEnv(): TokenBucketRateLimiter {
  const perSec = Math.max(1, Number(process.env.RIOT_RGAPI_MAX_PER_SECOND ?? 18));
  const burst = Math.max(perSec, Number(process.env.RIOT_RGAPI_BURST ?? 18));
  return new TokenBucketRateLimiter(burst, perSec / 1000);
}
