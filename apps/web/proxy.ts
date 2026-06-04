// Next.js Edge Proxy — Rate limiting + Security headers
// Vercel Edge Runtime'da çalışır, her request'te tetiklenir
import { NextRequest, NextResponse } from "next/server";

function numEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ── Edge rate limit (IP başına) — Riot ürün kotasına zarar vermemek için muhafazakâr varsayılanlar
// Riot anahtarı tipik üst sınır: ~20/s ve ~100/120s (ürün bazında); burada tek IP'nin tüketimini sınırlıyoruz.
const API_BURST_WINDOW_MS = numEnv("PROXY_API_BURST_WINDOW_MS", 10_000);
const API_BURST_MAX = numEnv("PROXY_API_BURST_MAX", 6);
const API_MINUTE_WINDOW_MS = numEnv("PROXY_API_MINUTE_WINDOW_MS", 60_000);
const API_MAX_PER_MINUTE = numEnv("PROXY_API_MAX_PER_MINUTE", 22);

const CONTACT_WINDOW_MS = 60_000;
const MAX_CONTACT = numEnv("PROXY_CONTACT_MAX_PER_MINUTE", 5);

const RIOT_AUTH_WINDOW_MS = numEnv("PROXY_RIOT_AUTH_WINDOW_MS", 60_000);
const MAX_RIOT_AUTH = numEnv("PROXY_RIOT_AUTH_MAX_PER_MINUTE", 45);

// Edge'de Redis yok — in-memory (her edge instance için geçerli, yeterli koruma)
const store = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  if (store.size > 5000) cleanup();

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfter: 0 };
  }

  entry.count++;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > max) {
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: max - entry.count, retryAfter: 0 };
}

// ── Korunan rotalar ───────────────────────────────────────────────────────
const API_ROUTES = ["/api/valorant", "/api/player", "/api/matches", "/api/leaderboard", "/api/match"];
const CONTACT_ROUTE = "/api/contact";
const ADMIN_ROUTES = ["/api/admin"];
const RIOT_AUTH_PREFIX = "/api/auth/riot";

// ── Security headers ──────────────────────────────────────────────────────
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      // Next.js hydration + inline scripts için gerekli
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Valorant görselleri
      "img-src 'self' data: blob: https://media.valorant-api.com https://assets.henrikdev.xyz https://trackercdn.com https://*.valorant-api.com",
      // connect-src: kendi API'lerimiz + Riot auth/API endpoint'leri
      [
        "connect-src",
        "'self'",
        "https://auth.riotgames.com",
        "https://europe.api.riotgames.com",
        "https://na.api.riotgames.com",
        "https://ap.api.riotgames.com",
        "https://api.henrikdev.xyz",
      ].join(" "),
      // Riot auth sayfasına form submit / redirect için
      "form-action 'self' https://auth.riotgames.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

// ── Proxy (Next.js request edge handler; eski adı: middleware) ───────────────
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const secret = req.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (pathname.startsWith(CONTACT_ROUTE)) {
    const { allowed, remaining, retryAfter } = rateLimit(`rl:contact:${ip}`, MAX_CONTACT, CONTACT_WINDOW_MS);
    if (!allowed) {
      const res = NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin.", retryAfter },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfter));
      return addSecurityHeaders(res);
    }
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return addSecurityHeaders(res);
  }

  if (pathname.startsWith(RIOT_AUTH_PREFIX)) {
    const { allowed, remaining, retryAfter } = rateLimit(`rl:riotauth:${ip}`, MAX_RIOT_AUTH, RIOT_AUTH_WINDOW_MS);
    if (!allowed) {
      const res = NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin.", retryAfter },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(retryAfter));
      return addSecurityHeaders(res);
    }
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    return addSecurityHeaders(res);
  }

  if (API_ROUTES.some(r => pathname.startsWith(r))) {
    const burst = rateLimit(`rl:api:burst:${ip}`, API_BURST_MAX, API_BURST_WINDOW_MS);
    if (!burst.allowed) {
      const res = NextResponse.json(
        { error: "Çok fazla istek. Kısa sürede tekrar deneyin.", retryAfter: burst.retryAfter },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(burst.retryAfter));
      return addSecurityHeaders(res);
    }
    const minute = rateLimit(`rl:api:min:${ip}`, API_MAX_PER_MINUTE, API_MINUTE_WINDOW_MS);
    if (!minute.allowed) {
      const res = NextResponse.json(
        { error: "Çok fazla istek. Lütfen bekleyin.", retryAfter: minute.retryAfter },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(minute.retryAfter));
      res.headers.set("X-RateLimit-Limit", String(API_MAX_PER_MINUTE));
      res.headers.set("X-RateLimit-Remaining", "0");
      return addSecurityHeaders(res);
    }
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(API_MAX_PER_MINUTE));
    res.headers.set("X-RateLimit-Remaining", String(minute.remaining));
    return addSecurityHeaders(res);
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
