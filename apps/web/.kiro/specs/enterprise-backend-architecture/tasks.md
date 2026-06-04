# Implementation Plan: Enterprise Backend Architecture

## Overview

Refactor the monolithic route handler structure into a layered enterprise architecture with CacheManager, RateLimiter, ApiGateway, MatchProcessor, StatsEngine, DevlogManager, and RetryHandler. All existing files are preserved; new services are built on top.

## Tasks

- [x] 1. Extend Prisma schema with new models
  - Add `MatchRecord` model with all required fields and `Player` relation
  - Add `AgentStats` model with `@@unique([puuid, agent])` constraint
  - Add `DevlogEntry` model with JSON `items` field
  - Add `matchCount` and `lastMatchAt` fields to existing `Player` model
  - Add composite index `@@index([puuid, startedAt])` to `MatchRecord`
  - Preserve all `@db.ObjectId` and `@map("_id")` annotations for MongoDB Atlas
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 2. Implement CacheManager
  - [x] 2.1 Create `lib/cache/cache-manager.ts` with `TTL_TABLE`, `buildKey`, `get`, `set`, `invalidate`
    - Implement Redis-first with silent in-memory `Map<string, {data, exp}>` fallback
    - Normalize keys to lowercase; format: `{type}:{name}:{tag}`
    - Cache 429 error responses with `rateLimit429` TTL (120s)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 2.2 Write property test for CacheManager — Property 1: Correct TTL per data type
    - **Property 1: Every cache key gets the TTL defined in TTL_TABLE**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.9, 5.5**
    - Use `fc.constantFrom(...Object.keys(TTL_TABLE))`, `fc.string()` arbitraries

  - [ ]* 2.3 Write property test for CacheManager — Property 2: In-memory fallback on Redis failure
    - **Property 2: get/set never throw when Redis is unavailable**
    - **Validates: Requirements 1.6, 1.10, 2.5**
    - Use `fc.string()`, `fc.anything()` arbitraries

  - [ ]* 2.4 Write property test for CacheManager — Property 3: Key format invariant
    - **Property 3: buildKey always produces `{type}:{name}:{tag}` with lowercase normalization**
    - **Validates: Requirements 1.8, 2.4**
    - Use `fc.string()`, `fc.string()` arbitraries

- [x] 3. Implement RateLimiter middleware
  - [x] 3.1 Create `middleware.ts` at project root with Next.js middleware
    - 60s window, max 30 requests per IP, key: `ratelimit:{ip}`
    - Read IP from `x-forwarded-for` first, fallback to `request.ip`
    - Return `429` with `Retry-After` header when limit exceeded
    - Apply only to `/api/valorant`, `/api/player`, `/api/matches`, `/api/leaderboard`
    - In-memory fallback when Redis unavailable
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 3.2 Write property test for RateLimiter — Property 4: 429 + Retry-After on limit exceeded
    - **Property 4: Any IP exceeding 30 requests in 60s window gets 429 with Retry-After**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Use `fc.ipV4()`, `fc.integer({min:31, max:100})` arbitraries

  - [ ]* 3.3 Write property test for RateLimiter — Property 5: IP detection
    - **Property 5: x-forwarded-for header takes precedence over request.ip**
    - **Validates: Requirement 2.7**

- [x] 4. Implement MatchProcessor service
  - [x] 4.1 Create `lib/services/match-processor.ts` with all four exported functions
    - `processMatch(rawMatch)` — wraps `transformMatch` from `transformer.ts`
    - `processPlayerStats(match, puuid)` — calculates ACS, ADR, K/D, hsPercent
    - `processWeaponKills(kills, puuid)` — extracts weapon kill distribution
    - `processLifetimeStats(matches, name, tag)` — wraps `processStats` from `stats-processor.ts`
    - Add JSDoc to every public method; keep each method under 30 lines
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 4.2 Write property test for MatchProcessor — Property 6: processMatch output schema
    - **Property 6: processMatch output always has matchId, map, mode, players, teams**
    - **Validates: Requirements 3.5, 8.2**
    - Use custom `rawMatchArbitrary`

  - [ ]* 4.3 Write property test for MatchProcessor — Property 7: Stats are mathematically derivable
    - **Property 7: acs, adr, kd, hsPercent are derivable from raw match numbers**
    - **Validates: Requirements 3.6, 3.7, 8.3, 8.4**
    - Use `fc.record({kills, deaths, headshots, bodyshots, legshots, ...})` arbitrary

  - [ ]* 4.4 Write property test for MatchProcessor — Property 21: Backward compatibility
    - **Property 21: processLifetimeStats output equals processStats output for same input**
    - **Validates: Requirement 8.6**
    - Use `fc.array(matchArbitrary)` arbitrary

- [x] 5. Implement StatsEngine service
  - [x] 5.1 Create `lib/services/stats-engine.ts` with all five methods as pure functions
    - `calcEconomy` — full buy (≥3900), force (1000–3899), eco (<1000) with win rates
    - `calcClutch` — track 1v1–1v5 scenarios, clutchRating 0–100 with weighted scoring
    - `calcAgentPerformance` — per-agent played, wins, avgAcs, avgKd
    - `calcTilt` — tilt score 0–100 from last 5 matches win rate, K/D trend, ACS avg
    - `calcDuoSynergy` — synergy score 0–100 from shared matches, win rate, avg K/D
    - Return `{ insufficient_data: true, reason, matchCount }` when input < 3 matches
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 5.2 Write property test for StatsEngine — Property 9: Economy analysis bounds
    - **Property 9: fullBuyRounds + forceRounds + ecoRounds === total rounds; win rates 0–100**
    - **Validates: Requirements 4.1, 4.2**
    - Use `fc.array(roundArbitrary)` arbitrary

  - [ ]* 5.3 Write property test for StatsEngine — Property 10: Clutch stats bounds
    - **Property 10: clutchRating in [0,100]; totalWins <= totalClutches**
    - **Validates: Requirements 4.3, 4.4**
    - Use `fc.array(roundArbitrary)` arbitrary

  - [ ]* 5.4 Write property test for StatsEngine — Property 11: All scores in [0,100]
    - **Property 11: calcTilt and calcDuoSynergy scores always in [0,100]**
    - **Validates: Requirements 4.6, 4.7**
    - Use `fc.array(matchArbitrary, {minLength: 5})` arbitrary

  - [ ]* 5.5 Write property test for StatsEngine — Property 12: Insufficient data guard
    - **Property 12: All StatsEngine methods return insufficient_data when input < 3 matches**
    - **Validates: Requirement 4.8**

  - [ ]* 5.6 Write property test for StatsEngine — Property 13: Pure function idempotency
    - **Property 13: Same input always produces same output; no external state dependency**
    - **Validates: Requirement 4.9**
    - Use `fc.array(matchArbitrary)` arbitrary

- [ ] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement RetryHandler
  - [x] 7.1 Create `lib/retry-handler.ts` with `withRetry` function
    - 429: 2s delay, max 2 attempts; 500: 1s delay, max 1 attempt
    - Log each attempt: `[RetryHandler] attempt {n}/{max}: {url}`
    - Fallback chain: Redis stale → MongoDB last record → `{ error, retryAfter }`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 7.2 Write property test for RetryHandler — Property 18: Retry + fallback chain order
    - **Property 18: Failed API call follows retry → Redis stale → MongoDB → error chain**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
    - Use `fc.constantFrom(429, 500)` arbitrary

  - [ ]* 7.3 Write property test for RetryHandler — Property 19: Stale data flag
    - **Property 19: Stale cache or DB data always includes `{ stale: true, warning: string }`**
    - **Validates: Requirement 7.7**

  - [ ]* 7.4 Write property test for RetryHandler — Property 20: Unexpected error handling
    - **Property 20: Unexpected exceptions return 500 without stack trace**
    - **Validates: Requirement 7.9**

- [x] 8. Implement ApiGateway service
  - [x] 8.1 Create `lib/services/api-gateway.ts` with all gateway methods
    - `hGet(path)` — base HenrikDev API call
    - `fetchPlayerProfile`, `fetchMatches`, `fetchMatchDetail`, `fetchLeaderboard`
    - `fetchViaRiot` — used when `RIOT_API_KEY` env var is defined
    - `getProfile` — cache check → API call → DB upsert orchestration
    - Auto-select HenrikDev when `RIOT_API_KEY` is absent; no error thrown
    - Wrap all errors in `{ error: string, status: number, retryAfter?: number }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.9, 6.1, 6.2, 6.5_

  - [ ]* 8.2 Write property test for ApiGateway — Property 8: Standard error response format
    - **Property 8: All API errors return `{ error: string, status: number }` minimum shape**
    - **Validates: Requirements 3.9, 7.8**

  - [ ]* 8.3 Write property test for ApiGateway — Property 17: Cron security
    - **Property 17: Any request to /api/cron/* without CRON_SECRET returns 401**
    - **Validates: Requirement 6.7**

- [x] 9. Implement DevlogManager service
  - [x] 9.1 Create `content/devlog/` directory with example `v1.5.0.json` entry
    - _Requirements: 5.1_

  - [x] 9.2 Create `lib/services/devlog-manager.ts` with `getEntries` and `validateEntry`
    - Read `*.json` and `*.md` (frontmatter) files from `content/devlog/`
    - Validate required fields: `version` (vX.Y.Z semver), `date` (ISO 8601), `title`, `category`, `items`
    - Sort by `date` descending; skip invalid files with console.warn; never throw
    - Cache result with 3600s TTL via CacheManager
    - Return empty array when directory is empty or missing
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 9.3 Write property test for DevlogManager — Property 14: Validation rejects incomplete entries
    - **Property 14: validateEntry returns false for any entry missing required fields**
    - **Validates: Requirements 5.2, 5.6, 5.7**
    - Use `fc.record({...})` with missing fields arbitrary

  - [ ]* 9.4 Write property test for DevlogManager — Property 15: Sort invariant
    - **Property 15: getEntries always returns entries sorted by date descending**
    - **Validates: Requirement 5.3**
    - Use `fc.array(devlogArbitrary)` arbitrary

  - [ ]* 9.5 Write property test for DevlogManager — Property 16: Error isolation
    - **Property 16: N valid + M invalid files → exactly N entries returned**
    - **Validates: Requirement 5.4**

- [x] 10. Update route handlers to use new service layer
  - [x] 10.1 Refactor `app/api/valorant/route.ts` to delegate to `ApiGateway.getProfile`
    - Remove inline business logic; keep only request parsing and response formatting
    - _Requirements: 3.1, 3.4_

  - [x] 10.2 Refactor `app/api/player/[name]/[tag]/route.ts` to use `ApiGateway`
    - _Requirements: 3.1, 3.4_

  - [x] 10.3 Refactor `app/api/matches/[name]/[tag]/route.ts` to use `ApiGateway`
    - _Requirements: 3.1, 3.4_

  - [x] 10.4 Refactor `app/api/leaderboard/route.ts` to use `ApiGateway.fetchLeaderboard`
    - _Requirements: 3.1, 3.4_

  - [x] 10.5 Update `app/api/cron/refresh-players/route.ts` to validate `CRON_SECRET`
    - Return `401 Unauthorized` when secret is missing or invalid
    - _Requirements: 6.7_

- [x] 11. Add security headers to vercel.json
  - Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block` to `vercel.json`
  - _Requirements: 6.3_

  - [ ]* 11.1 Write unit test for security headers
    - Parse `vercel.json` and assert all three security headers are present
    - _Requirements: 6.3_

- [ ] 12. Write Prisma schema property test — Property 22: AgentStats unique constraint
  - [ ]* 12.1 Write property test for AgentStats unique constraint
    - **Property 22: Inserting duplicate puuid+agent combination throws Prisma unique constraint error**
    - **Validates: Requirement 9.7**
    - Use `fc.string()`, `fc.string()` arbitraries

- [ ] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `transformer.ts` and `stats-processor.ts` are never deleted; MatchProcessor wraps them
- Property tests use `fast-check` — install with `npm install --save-dev fast-check`
- Test files live in `valorant-tracker/__tests__/`
- Each property test runs minimum 100 iterations (fast-check default)
