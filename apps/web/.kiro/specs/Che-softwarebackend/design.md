# Design Document — Enterprise Backend Architecture

## Overview

KediPotter Tracker'ın mevcut monolitik route handler yapısı, enterprise düzey bir katmanlı mimariye dönüştürülecektir. Hedef; sorumlulukları net biçimde ayrılmış servisler, akıllı önbellekleme, güçlü hata yönetimi ve dinamik içerik yönetimi inşa etmektir.

Mevcut durumda tüm iş mantığı `app/api/valorant/route.ts` içinde yığılmış durumdadır. Bu tasarım; `CacheManager`, `RateLimiter`, `MatchProcessor`, `StatsEngine`, `DevlogManager` ve `ApiGateway` katmanlarını tanımlayarak bu karmaşıklığı çözecektir.

**Stack:** Next.js 16, Vercel Serverless, MongoDB Atlas (Prisma), Redis (ioredis), TypeScript strict

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Middleware                    │
│              middleware.ts — RateLimiter                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Route Handlers                         │
│   app/api/valorant/route.ts  (ince controller katmanı)  │
│   app/api/player/  app/api/matches/  app/api/leaderboard│
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   ApiGateway                             │
│         lib/services/api-gateway.ts                      │
│   önbellek kontrolü → dış API → dönüşüm → DB upsert     │
└──────┬─────────────────┬──────────────────┬─────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────────┐
│ CacheManager│  │MatchProcessor│  │   StatsEngine     │
│lib/cache/   │  │lib/services/ │  │   lib/services/   │
│cache-manager│  │match-processor│ │   stats-engine.ts │
└──────┬──────┘  └───────┬──────┘  └───────────────────┘
       │                 │
┌──────▼──────┐  ┌───────▼──────┐
│   Redis     │  │  transformer  │
│  ioredis    │  │  (mevcut)     │
│+ in-memory  │  └──────────────┘
│  fallback   │
└─────────────┘
```

---

## Components and Interfaces

### 1. Klasör Yapısı

```
valorant-tracker/
├── middleware.ts                        # RateLimiter (Next.js middleware)
├── lib/
│   ├── cache/
│   │   └── cache-manager.ts            # CacheManager — TTL tablosu + fallback
│   ├── services/
│   │   ├── api-gateway.ts              # ApiGateway — dış API soyutlama
│   │   ├── match-processor.ts          # MatchProcessor — maç veri işleme
│   │   ├── stats-engine.ts             # StatsEngine — gelişmiş istatistik
│   │   └── devlog-manager.ts           # DevlogManager — içerik yönetimi
│   ├── retry-handler.ts                # RetryHandler — retry + fallback zinciri
│   ├── transformer.ts                  # (mevcut, korunacak)
│   ├── stats-processor.ts              # (mevcut, korunacak)
│   ├── advanced-stats.ts               # (mevcut, korunacak)
│   ├── redis.ts                        # (mevcut, korunacak)
│   └── prisma.ts                       # (mevcut, korunacak)
├── content/
│   └── devlog/                         # JSON/Markdown devlog dosyaları
│       ├── v1.4.0.json
│       └── v1.5.0.md
└── prisma/
    └── schema.prisma                   # Genişletilmiş şema
```

### 2. CacheManager Arayüzü

```typescript
// lib/cache/cache-manager.ts
export const TTL_TABLE = {
  matches:      600,   // maç geçmişi — 10 dakika
  mmr:          300,   // rank/MMR — 5 dakika
  leaderboard:  180,   // leaderboard — 3 dakika
  matchDetail:  7200,  // maç detayı — 2 saat
  profile:      600,   // profil (player + matches) — 10 dakika
  devlog:       3600,  // devlog listesi — 1 saat
  rateLimit429: 120,   // 429 hata yanıtı — 2 dakika
} as const;

export type CacheKey = keyof typeof TTL_TABLE;

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set(key: string, data: unknown, ttl: number): Promise<void>;
  buildKey(type: CacheKey, name: string, tag: string): string;
  invalidate(key: string): Promise<void>;
}
```

**Anahtar Formatı:** `{veriTipi}:{oyuncuAdı}:{tag}` — örnek: `profile:kedi#1234`

**Fallback Stratejisi:** Redis bağlantısı kurulamazsa veya hata fırlatırsa, `Map<string, {data, exp}>` tabanlı in-memory önbelleğe sessizce geçilir. Hata hiçbir zaman dışarı sızmaz.

---

### 3. RateLimiter Arayüzü

```typescript
// middleware.ts
export interface RateLimitConfig {
  windowMs: number;   // 60_000 (60 saniye)
  maxRequests: number; // 30
  keyPrefix: string;  // "ratelimit:"
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // saniye
}
```

**Korunan Rotalar:** `/api/valorant`, `/api/player`, `/api/matches`, `/api/leaderboard`

**IP Tespiti:** Vercel ortamında `x-forwarded-for` header'ından ilk IP alınır; yoksa `request.ip` kullanılır.

**Redis Anahtarı:** `ratelimit:{ip}` — TTL otomatik olarak pencere süresiyle senkronize edilir.

---

### 4. ApiGateway Arayüzü

```typescript
// lib/services/api-gateway.ts
export interface ApiGateway {
  // HenrikDev API
  hGet(path: string): Promise<unknown>;
  fetchPlayerProfile(name: string, tag: string): Promise<ProfileResult>;
  fetchMatches(name: string, tag: string, size?: number): Promise<TransformedMatch[]>;
  fetchMatchDetail(matchId: string): Promise<TransformedMatch>;
  fetchLeaderboard(region: string, page?: number): Promise<LeaderboardResult>;

  // Riot Official API (RIOT_API_KEY varsa)
  fetchViaRiot(name: string, tag: string): Promise<ProfileResult>;

  // Ortak
  getProfile(name: string, tag: string): Promise<ProfileResult>; // önbellek → API → DB
}

export interface ProfileResult {
  player: TransformedPlayer;
  matches: TransformedMatch[];
  cached: boolean;
  stale?: boolean;
  warning?: string;
}
```

**Karar Mantığı:** `RIOT_API_KEY` ortam değişkeni tanımlıysa Riot Official API kullanılır; aksi hâlde HenrikDev'e otomatik geçilir.

---

### 5. MatchProcessor Arayüzü

```typescript
// lib/services/match-processor.ts
export interface PlayerMatchStats {
  puuid: string;
  acs: number;
  adr: number;
  kd: number;
  hsPercent: number;
  kills: number;
  deaths: number;
  assists: number;
}

export interface MatchProcessor {
  /** Ham API verisini normalize edilmiş TransformedMatch'e dönüştürür */
  processMatch(rawMatch: unknown): TransformedMatch;

  /** Belirli bir oyuncunun maç istatistiklerini hesaplar */
  processPlayerStats(match: TransformedMatch, puuid: string): PlayerMatchStats;

  /** Oyuncunun silah bazlı kill dağılımını çıkarır */
  processWeaponKills(kills: unknown[], puuid: string): Record<string, number>;

  /** Birden fazla maç üzerinden yaşam boyu istatistikleri hesaplar */
  processLifetimeStats(matches: TransformedMatch[], name: string, tag: string): LifetimeStats;
}
```

**Geriye Dönük Uyumluluk:** `transformer.ts::transformMatch` ve `stats-processor.ts::processStats` fonksiyonları silinmez; `MatchProcessor` bu fonksiyonları içsel olarak çağırır ve üzerine inşa eder.

---

### 6. StatsEngine Arayüzü

```typescript
// lib/services/stats-engine.ts
export interface StatsEngine {
  calcEconomy(rawRounds: unknown[], puuid: string): EconomyStats | InsufficientData;
  calcClutch(rawRounds: unknown[], puuid: string, map: string): ClutchStats | InsufficientData;
  calcAgentPerformance(matches: TransformedMatch[], name: string, tag: string): AgentStat[];
  calcTilt(matches: TransformedMatch[], name: string, tag: string): TiltStats | InsufficientData;
  calcDuoSynergy(matches: TransformedMatch[], name: string, tag: string): DuoPartner[];
}

export interface InsufficientData {
  insufficient_data: true;
  reason: string;
  matchCount: number;
}
```

**Minimum Veri Eşiği:** 3 maçtan az veri varsa `InsufficientData` döndürülür; hesaplama yapılmaz.

**Pure Function Garantisi:** Tüm metodlar yan etki içermez; aynı girdi için her zaman aynı çıktıyı üretir.

---

### 7. DevlogManager Arayüzü

```typescript
// lib/services/devlog-manager.ts
export interface DevlogEntry {
  version: string;   // semver: vX.Y.Z
  date: string;      // ISO 8601
  title: string;
  category: "api" | "ui" | "security" | "performance";
  items: { text: string; status: "done" | "progress" | "planned" }[];
  published?: boolean;
}

export interface DevlogManager {
  getEntries(): Promise<DevlogEntry[]>;
  validateEntry(raw: unknown): raw is DevlogEntry;
}
```

**Dosya Formatları:** `content/devlog/*.json` veya `content/devlog/*.md` (frontmatter + liste)

**Hata İzolasyonu:** Geçersiz bir dosya diğerlerini etkilemez; konsola uyarı loglanır ve o giriş atlanır.

---

### 8. RetryHandler Arayüzü

```typescript
// lib/retry-handler.ts
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  retryOn: number[];  // HTTP status kodları: [429, 500]
}

export interface RetryHandler {
  withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    fallbacks: FallbackChain
  ): Promise<T | FallbackResult>;
}

export interface FallbackChain {
  cacheKey?: string;
  dbQuery?: () => Promise<unknown>;
}

export interface FallbackResult {
  data: unknown;
  stale: true;
  warning: string;
}
```

**Retry Parametreleri:**
- 429 hatası: 2 saniye bekle, max 2 deneme
- 500 hatası: 1 saniye bekle, max 1 deneme

**Fallback Zinciri:** Retry başarısız → Redis stale veri → MongoDB son kayıt → `{ error, retryAfter: number }`

---

## Data Models

### Redis TTL Tablosu

| Önbellek Anahtarı | Format | TTL (sn) | Açıklama |
|---|---|---|---|
| `profile:{name}:{tag}` | `profile:kedi:1234` | 600 | Oyuncu + maçlar birleşik |
| `matches:{name}:{tag}` | `matches:kedi:1234` | 600 | Maç geçmişi listesi |
| `mmr:{name}:{tag}` | `mmr:kedi:1234` | 300 | Rank / MMR verisi |
| `leaderboard:{region}:{page}` | `leaderboard:eu:1` | 180 | Sıralama tablosu |
| `match:{matchId}` | `match:abc123` | 7200 | Tek maç detayı |
| `devlog:list` | `devlog:list` | 3600 | Devlog giriş listesi |
| `ratelimit:{ip}` | `ratelimit:1.2.3.4` | 60 | Rate limit sayacı |
| `error:429:{name}:{tag}` | `error:429:kedi:1234` | 120 | 429 hata yanıtı |

---

### Genişletilmiş Prisma Şeması

```prisma
// prisma/schema.prisma — mevcut Player modeline ek olarak

model Player {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  puuid       String        @unique
  name        String
  tag         String
  region      String
  level       Int           @default(0)
  cardSmall   String        @default("")
  tier        Int           @default(0)
  tierName    String        @default("Unranked")
  elo         Int           @default(0)
  rr          Int           @default(0)
  rrChange    Int           @default(0)
  rankIconUrl String        @default("")
  matchCount  Int           @default(0)        // YENİ
  lastMatchAt DateTime?                        // YENİ
  updatedAt   DateTime      @updatedAt
  createdAt   DateTime      @default(now())
  matches     MatchRecord[]                    // YENİ ilişki

  @@index([elo])
  @@index([name, tag])
}

model MatchRecord {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  matchId   String   @unique
  puuid     String
  map       String
  mode      String
  result    String   // "win" | "loss"
  acs       Int
  kills     Int
  deaths    Int
  assists   Int
  agent     String
  startedAt DateTime
  rounds    Int
  player    Player   @relation(fields: [puuid], references: [puuid])

  @@index([puuid, startedAt])
}

model AgentStats {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  puuid     String
  agent     String
  played    Int      @default(0)
  wins      Int      @default(0)
  avgAcs    Float    @default(0)
  avgKd     Float    @default(0)
  updatedAt DateTime @updatedAt

  @@unique([puuid, agent])
}

model DevlogEntry {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  version   String   @unique
  date      DateTime
  title     String
  category  String   // "api" | "ui" | "security" | "performance"
  items     Json
  published Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

---

### MatchProcessor Örnek İmplementasyonu

```typescript
// lib/services/match-processor.ts
import { transformMatch } from "@/lib/transformer";
import { processStats, type LifetimeStats } from "@/lib/stats-processor";
import type { TransformedMatch } from "@/lib/transformer";

export interface PlayerMatchStats {
  puuid: string;
  acs: number;
  adr: number;
  kd: number;
  hsPercent: number;
  kills: number;
  deaths: number;
  assists: number;
}

/**
 * Ham API verisini normalize edilmiş TransformedMatch nesnesine dönüştürür.
 * transformer.ts::transformMatch üzerine inşa edilmiştir.
 */
export function processMatch(rawMatch: unknown): TransformedMatch {
  return transformMatch(rawMatch as Parameters<typeof transformMatch>[0]);
}

/**
 * Belirli bir oyuncunun tek maç istatistiklerini hesaplar.
 */
export function processPlayerStats(
  match: TransformedMatch,
  puuid: string
): PlayerMatchStats {
  const player = match.players.find(p => p.puuid === puuid);
  if (!player) throw new Error(`Player ${puuid} not found in match ${match.matchId}`);

  const totalShots = player.stats.headshots + player.stats.bodyshots + player.stats.legshots;
  const kd = player.stats.deaths > 0
    ? parseFloat((player.stats.kills / player.stats.deaths).toFixed(2))
    : player.stats.kills;

  return {
    puuid,
    acs: player.acs,
    adr: player.adr,
    kd,
    hsPercent: totalShots > 0 ? Math.round((player.stats.headshots / totalShots) * 100) : 0,
    kills: player.stats.kills,
    deaths: player.stats.deaths,
    assists: player.stats.assists,
  };
}

/**
 * Oyuncunun silah bazlı kill dağılımını kills dizisinden çıkarır.
 */
export function processWeaponKills(
  kills: unknown[],
  puuid: string
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const kill of kills) {
    const k = kill as { killer_puuid?: string; damage_weapon_name?: string };
    if (k.killer_puuid === puuid && k.damage_weapon_name) {
      result[k.damage_weapon_name] = (result[k.damage_weapon_name] ?? 0) + 1;
    }
  }
  return result;
}

/**
 * Birden fazla maç üzerinden yaşam boyu istatistikleri hesaplar.
 * stats-processor.ts::processStats üzerine inşa edilmiştir.
 */
export function processLifetimeStats(
  matches: TransformedMatch[],
  name: string,
  tag: string
): LifetimeStats {
  return processStats(matches, name, tag);
}
```

---

### DevLog JSON Formatı

```json
{
  "version": "v1.5.0",
  "date": "2025-05-01T00:00:00Z",
  "title": "Enterprise Backend Mimarisi",
  "category": "api",
  "items": [
    { "text": "CacheManager katmanı oluşturuldu", "status": "done" },
    { "text": "RateLimiter middleware eklendi", "status": "progress" },
    { "text": "MatchProcessor servisi yazıldı", "status": "planned" }
  ]
}
```

### DevLog Markdown Formatı

```markdown
---
version: v1.5.0
date: 2025-05-01T00:00:00Z
title: Enterprise Backend Mimarisi
category: api
---

- [done] CacheManager katmanı oluşturuldu
- [progress] RateLimiter middleware eklendi
- [planned] MatchProcessor servisi yazıldı
```

---

## Correctness Properties

*Bir özellik (property), sistemin tüm geçerli çalışmalarında doğru olması gereken bir karakteristik veya davranıştır — temelde sistemin ne yapması gerektiğine dair biçimsel bir ifadedir. Özellikler, insan tarafından okunabilir spesifikasyonlar ile makine tarafından doğrulanabilir doğruluk garantileri arasındaki köprüyü oluşturur.*

---

### Property 1: Her Veri Tipi İçin Doğru TTL

*Herhangi bir* veri tipi ve önbellek anahtarı için, `CacheManager.set` çağrısından sonra Redis'te saklanan anahtarın TTL değeri, `TTL_TABLE`'da tanımlanan değere eşit olmalıdır.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.9, 5.5**

---

### Property 2: Redis Yoksa In-Memory Fallback

*Herhangi bir* Redis bağlantı hatası veya `REDIS_URL` yokluğu durumunda, `CacheManager.get` ve `CacheManager.set` çağrıları exception fırlatmadan in-memory Map üzerinden çalışmaya devam etmelidir.

**Validates: Requirements 1.6, 1.10, 2.5**

---

### Property 3: Önbellek Anahtarı Formatı

*Herhangi bir* veri tipi, oyuncu adı ve tag kombinasyonu için, `buildKey` fonksiyonunun ürettiği anahtar `{veriTipi}:{oyuncuAdı}:{tag}` formatına uymalıdır; büyük/küçük harf normalizasyonu uygulanmalıdır.

**Validates: Requirements 1.8, 2.4**

---

### Property 4: Rate Limit Aşılınca 429 + Retry-After

*Herhangi bir* IP adresi için, 60 saniyelik pencerede 30 isteği aşan sonraki her istek; `429 Too Many Requests` HTTP yanıtı ve `Retry-After` başlığı içermelidir.

**Validates: Requirements 2.1, 2.2, 2.3**

---

### Property 5: IP Tespiti

*Herhangi bir* gelen istek için, `x-forwarded-for` başlığı mevcutsa rate limiter bu başlıktan IP'yi okumalı; başlık yoksa `request.ip` kullanılmalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 6: processMatch Dönüşüm Doğruluğu

*Herhangi bir* geçerli ham API maç nesnesi için, `processMatch` fonksiyonunun çıktısı `TransformedMatch` şemasına uymalı; `matchId`, `map`, `mode`, `players` ve `teams` alanları dolu olmalıdır.

**Validates: Requirements 3.5, 8.2**

---

### Property 7: MatchProcessor İstatistik Hesaplama Doğruluğu

*Herhangi bir* `TransformedMatch` ve geçerli `puuid` için, `processPlayerStats` çıktısındaki `acs`, `adr`, `kd` ve `hsPercent` değerleri; maç verisindeki ham sayılardan matematiksel olarak türetilebilir olmalıdır.

**Validates: Requirements 3.6, 3.7, 8.3, 8.4**

---

### Property 8: Standart Hata Yanıt Formatı

*Herhangi bir* API hatası için, döndürülen yanıt `{ error: string, status: number }` asgari yapısına uymalıdır; 429 hatalarında ek olarak `retryAfter: number` alanı bulunmalıdır.

**Validates: Requirements 3.9, 7.8**

---

### Property 9: Ekonomi Analizi Doğruluğu ve Sınır Değerleri

*Herhangi bir* round verisi listesi için, `calcEconomy` fonksiyonunun çıktısındaki `fullBuyRounds + forceRounds + ecoRounds` toplamı toplam round sayısına eşit olmalı; tüm win rate değerleri 0–100 arasında olmalıdır.

**Validates: Requirements 4.1, 4.2**

---

### Property 10: Clutch İstatistikleri Doğruluğu ve Sınır Değerleri

*Herhangi bir* round verisi listesi için, `calcClutch` fonksiyonunun çıktısındaki `clutchRating` değeri 0–100 arasında olmalı; `totalWins` değeri `totalClutches` değerini aşmamalıdır.

**Validates: Requirements 4.3, 4.4**

---

### Property 11: Tüm Skor Hesaplamaları 0–100 Arasında

*Herhangi bir* maç listesi için, `calcTilt` ve `calcDuoSynergy` fonksiyonlarının ürettiği `score` ve `synergyScore` değerleri her zaman 0–100 arasında olmalıdır.

**Validates: Requirements 4.6, 4.7**

---

### Property 12: Yetersiz Veri Koruması

*Herhangi bir* 3'ten az maç içeren giriş için, `StatsEngine` metodları hesaplama yapmak yerine `{ insufficient_data: true }` döndürmelidir.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 13: Pure Function Garantisi (İdempotens)

*Herhangi bir* `StatsEngine` metodu için, aynı girdi ile iki kez çağrıldığında çıktı değişmemelidir; metodlar dış duruma bağımlı olmamalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 14: DevlogManager Doğrulama

*Herhangi bir* eksik zorunlu alan (`version`, `date`, `title`, `category`, `items`) içeren devlog girişi için, `validateEntry` fonksiyonu `false` döndürmeli ve bu giriş sonuç listesine dahil edilmemelidir.

**Validates: Requirements 5.2, 5.6, 5.7**

---

### Property 15: Devlog Sıralama Invariantı

*Herhangi bir* devlog giriş listesi için, `getEntries` fonksiyonunun döndürdüğü liste `date` alanına göre azalan sırada (en yeni önce) olmalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 16: Devlog Hata İzolasyonu

*Herhangi bir* N geçerli + M geçersiz devlog dosyası kombinasyonu için, `getEntries` fonksiyonu tam olarak N giriş döndürmeli; M geçersiz giriş sessizce atlanmalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 17: Cron Güvenliği

*Herhangi bir* `/api/cron/*` rotasına `CRON_SECRET` olmadan yapılan istek için, sistem `401 Unauthorized` döndürmelidir.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 18: Retry + Fallback Zinciri

*Herhangi bir* başarısız dış API çağrısı için, `RetryHandler` şu sırayı izlemelidir: (1) yapılandırılmış sayıda yeniden deneme, (2) Redis stale veri, (3) MongoDB son kayıt, (4) `{ error, retryAfter }` yanıtı. Her adım bir önceki başarısız olduğunda devreye girmelidir.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

---

### Property 19: Stale Veri Bayrağı

*Herhangi bir* stale (bayat) önbellek veya DB verisi döndürüldüğünde, yanıt `{ stale: true, warning: string }` alanlarını içermelidir.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 20: Beklenmedik Hata Yönetimi

*Herhangi bir* route handler'da beklenmedik exception fırlatıldığında, istemciye dönen yanıt `500 Internal Server Error` olmalı ve stack trace içermemelidir.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 21: MatchProcessor Geriye Dönük Uyumluluk

*Herhangi bir* `TransformedMatch` listesi için, `processLifetimeStats(matches, name, tag)` çıktısı `processStats(matches, name, tag)` çıktısıyla eşdeğer olmalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

### Property 22: AgentStats Unique Constraint

*Herhangi bir* `puuid` + `agent` kombinasyonu için, `AgentStats` tablosuna aynı kombinasyonla ikinci bir kayıt eklemeye çalışıldığında Prisma unique constraint hatası fırlatmalıdır.

 param($m)
    $m.Value -replace 'Validates:', 'Validates:' -replace 'Gereksinim\b', 'Requirements'


---

## Error Handling

### Hata Sınıflandırması

| HTTP Kodu | Durum | Yanıt | Retry? |
|---|---|---|---|
| 400 | Geçersiz parametre | `{ error: string, status: 400 }` | Hayır |
| 401 | API key geçersiz / Cron yetkisiz | `{ error: string, status: 401 }` | Hayır |
| 403 | Profil gizli | `{ error: string, status: 403 }` | Hayır |
| 404 | Oyuncu bulunamadı | `{ error: string, status: 404 }` | Hayır |
| 429 | Rate limit aşıldı | `{ error, status: 429, retryAfter: number }` | Evet (2x, 2s) |
| 500 | Sunucu hatası | `{ error: string, status: 500 }` | Evet (1x, 1s) |

### Fallback Zinciri (Görsel)

```
Dış API İsteği
      │
      ▼
  Başarılı? ──Evet──► Yanıtı döndür + önbelleğe al
      │
     Hayır
      │
      ▼
  429 veya 500?
      │
      ├─ 429 ──► 2s bekle, max 2 deneme
      └─ 500 ──► 1s bekle, max 1 deneme
                    │
                    ▼
              Hâlâ başarısız?
                    │
                    ▼
           Redis'te stale veri var mı?
                    │
            Evet ──► stale: true ile döndür
                    │
                   Hayır
                    │
                    ▼
           MongoDB'de kayıt var mı?
                    │
            Evet ──► stale: true ile döndür
                    │
                   Hayır
                    │
                    ▼
           { error, retryAfter: 90 } → 429
```

### Güvenlik Başlıkları (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## Testing Strategy

### İkili Test Yaklaşımı

Bu özellik hem **birim testleri** hem de **özellik tabanlı testler (property-based testing)** gerektirir. İkisi birbirini tamamlar:

- **Birim testleri:** Belirli örnekler, kenar durumlar ve entegrasyon noktaları
- **Özellik testleri:** Tüm geçerli girdiler üzerinde evrensel özelliklerin doğrulanması

### Özellik Tabanlı Test Kütüphanesi

**TypeScript için:** [`fast-check`](https://github.com/dubzzz/fast-check)

```bash
npm install --save-dev fast-check
```

Her özellik testi minimum **100 iterasyon** çalıştırılmalıdır (`fc.assert` varsayılan olarak 100 çalıştırır).

### Özellik Testi Etiket Formatı

Her test dosyasında ilgili tasarım özelliğine referans verilmelidir:

```typescript
// Feature: enterprise-backend-architecture, Property 1: Her veri tipi için doğru TTL
fc.assert(fc.property(
  fc.constantFrom("matches", "mmr", "leaderboard", "matchDetail", "profile"),
  fc.string(), fc.string(),
  (type, name, tag) => {
    const key = buildKey(type as CacheKey, name, tag);
    // TTL_TABLE[type] değerinin Redis'e set edildiğini doğrula
    ...
  }
), { numRuns: 100 });
```

### Test Dosyası Yapısı

```
valorant-tracker/
└── __tests__/
    ├── cache-manager.test.ts      # Özellik 1, 2, 3
    ├── rate-limiter.test.ts       # Özellik 4, 5
    ├── match-processor.test.ts    # Özellik 6, 7, 21
    ├── stats-engine.test.ts       # Özellik 9, 10, 11, 12, 13
    ├── devlog-manager.test.ts     # Özellik 14, 15, 16
    ├── retry-handler.test.ts      # Özellik 18, 19, 20
    ├── api-gateway.test.ts        # Özellik 8, 17
    └── prisma-schema.test.ts      # Özellik 22 + örnek testler
```

### Birim Test Kapsamı

**Kenar Durumlar (Edge Cases):**
- `< 3 maç` ile StatsEngine çağrısı → `insufficient_data: true`
- Boş `content/devlog/` dizini → boş dizi, exception yok
- `RIOT_API_KEY` tanımsız → HenrikDev'e otomatik geçiş
- Tüm whitespace içeren oyuncu adı → 400 hatası

**Entegrasyon Noktaları:**
- `ApiGateway.getProfile` → önbellek hit senaryosu (API çağrılmamalı)
- `ApiGateway.getProfile` → önbellek miss senaryosu (API çağrılmalı + önbelleğe alınmalı)
- Cron rotası → `CRON_SECRET` olmadan → 401

**Güvenlik Başlıkları:**
- `vercel.json` parse edilerek `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` varlığı doğrulanmalı

### Özellik Testi — Özellik Eşleştirme Tablosu

| Tasarım Özelliği | Test Dosyası | fast-check Arbitraries |
|---|---|---|
| Özellik 1 (TTL) | cache-manager.test.ts | `fc.constantFrom(cacheKeys)`, `fc.string()` |
| Özellik 2 (Fallback) | cache-manager.test.ts | `fc.string()`, `fc.anything()` |
| Özellik 3 (Key Format) | cache-manager.test.ts | `fc.string()`, `fc.string()` |
| Özellik 4 (Rate Limit) | rate-limiter.test.ts | `fc.ipV4()`, `fc.integer({min:31, max:100})` |
| Özellik 6 (processMatch) | match-processor.test.ts | Özel `rawMatchArbitrary` |
| Özellik 7 (Stats) | match-processor.test.ts | `fc.record({kills, deaths, ...})` |
| Özellik 9 (Ekonomi) | stats-engine.test.ts | `fc.array(roundArbitrary)` |
| Özellik 10 (Clutch) | stats-engine.test.ts | `fc.array(roundArbitrary)` |
| Özellik 11 (Skor 0-100) | stats-engine.test.ts | `fc.array(matchArbitrary, {minLength:5})` |
| Özellik 13 (Pure) | stats-engine.test.ts | `fc.array(matchArbitrary)` |
| Özellik 14 (Doğrulama) | devlog-manager.test.ts | `fc.record({...})` eksik alanlarla |
| Özellik 15 (Sıralama) | devlog-manager.test.ts | `fc.array(devlogArbitrary)` |
| Özellik 18 (Retry) | retry-handler.test.ts | `fc.constantFrom([429, 500])` |
| Özellik 21 (Uyumluluk) | match-processor.test.ts | `fc.array(matchArbitrary)` |
| Özellik 22 (Unique) | prisma-schema.test.ts | `fc.string()`, `fc.string()` |
