import type { RiotOutboundLimiter } from "@/lib/riot/rate-limiter";
import { getSharedRiotKeyOutboundLimiter, TokenBucketRateLimiter } from "@/lib/riot/rate-limiter";

export interface RgApiClientOptions {
  apiKey: string;
  /** Örn. americas, europe, asia */
  clusterHost: string;
  /** Varsayılan: paylaşımlı saniye + 2 dk limiter */
  outboundLimiter?: RiotOutboundLimiter;
  /** Eski davranış: yalnızca token bucket */
  limiter?: TokenBucketRateLimiter;
}

/**
 * X-Riot-Token ile Riot REST çağrıları + yerel rate limit (saniye ve 2 dakika penceresi).
 * Oyuncu OAuth token’ı ile çağrı için `riotFetchBearer` kullanın.
 */
export class RgApiClient {
  private readonly base: string;
  private readonly outbound: () => Promise<void>;

  constructor(private readonly opts: RgApiClientOptions) {
    const host = opts.clusterHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.base = host.includes(".")
      ? `https://${host}`
      : `https://${host}.api.riotgames.com`;
    if (opts.limiter) {
      const lim = opts.limiter;
      this.outbound = () => lim.acquire(1);
    } else {
      const lim = opts.outboundLimiter ?? getSharedRiotKeyOutboundLimiter();
      this.outbound = () => lim.acquire();
    }
  }

  /** Örn. path: `/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` */
  async getJson(path: string, init?: RequestInit, attempt = 0): Promise<unknown> {
    await this.outbound();
    const url = `${this.base}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      ...init,
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "X-Riot-Token": this.opts.apiKey,
        ...(init?.headers as Record<string, string>),
      },
    });
    if (res.status === 429 && attempt < 3) {
      const retryAfter = res.headers.get("Retry-After");
      const sec = retryAfter ? Number(retryAfter) : 2;
      await new Promise(r => setTimeout(r, Math.min(120, Math.max(1, sec)) * 1000));
      return this.getJson(path, init, attempt + 1);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`RGAPI ${res.status}: ${text.slice(0, 400)}`);
    return text ? (JSON.parse(text) as unknown) : null;
  }
}

export function riotFetchBearer(
  url: string,
  accessToken: string,
  limiter?: RiotOutboundLimiter
): Promise<Response> {
  const lim = limiter ?? getSharedRiotKeyOutboundLimiter();
  return lim.acquire().then(() =>
    fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    })
  );
}
