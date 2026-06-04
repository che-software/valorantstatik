# Gereksinimler Belgesi

## Giriş

KediPotter Tracker, Valorant oyuncularının istatistiklerini takip ettiği bir Next.js 16 tabanlı web platformudur. Mevcut sistem HenrikDev API ve Riot Official API üzerinden veri çekmekte, MongoDB (Prisma) ile kalıcı depolama ve Redis ile önbellekleme yapmaktadır.

Bu spec, platformun enterprise düzey bir backend mimarisine kavuşturulmasını kapsar. Hedef; ölçeklenebilir bir caching katmanı, akıllı rate limiting, temiz bir servis/controller ayrımı, gelişmiş istatistik hesaplama motoru, dinamik devlog sistemi, güçlendirilmiş güvenlik ve kapsamlı hata yönetimi inşa etmektir.

---

## Sözlük

- **CacheManager**: Redis ve in-memory fallback'i yöneten önbellekleme servisi
- **RateLimiter**: Gelen istekleri sınırlayan koruma katmanı
- **MatchProcessor**: Ham maç verisini işleyen ve dönüştüren servis
- **StatsEngine**: Ekonomi, clutch, ajan performansı hesaplamalarını yürüten mantık katmanı
- **DevlogManager**: JSON/Markdown tabanlı geliştirici günlüğü içerik yönetim servisi
- **ApiGateway**: Dış API çağrılarını (HenrikDev, Riot) soyutlayan adaptör katmanı
- **RetryHandler**: Başarısız API isteklerini yeniden deneyen mekanizma
- **Player**: Valorant oyuncusunu temsil eden veritabanı varlığı
- **TransformedMatch**: Ham API verisinden dönüştürülmüş, normalize edilmiş maç nesnesi
- **TTL**: Time-To-Live — önbellekte verinin geçerli kalma süresi (saniye cinsinden)
- **ELO**: Oyuncunun sayısal sıralama puanı
- **ACS**: Average Combat Score — maç başına ortalama savaş skoru
- **ADR**: Average Damage per Round — tur başına ortalama hasar
- **Clutch**: Takımda son kalan oyuncunun 1vX senaryosunu kazanması
- **Vercel**: Projenin deploy edildiği sunucusuz (serverless) platform

---

## Gereksinimler

### Gereksinim 1: Katmanlı Redis Önbellekleme Stratejisi

**Kullanıcı Hikayesi:** Bir platform kullanıcısı olarak, farklı veri türleri için optimize edilmiş önbellekleme süreleri sayesinde hem hızlı yanıt alabilmek hem de API kotasının verimli kullanılmasını istiyorum.

#### Kabul Kriterleri

1. THE **CacheManager** SHALL maç geçmişi (match history) verisini 600 saniye TTL ile önbelleklemek.
2. THE **CacheManager** SHALL MMR/rank verisini 300 saniye TTL ile önbelleklemek.
3. THE **CacheManager** SHALL leaderboard verisini 180 saniye TTL ile önbelleklemek.
4. THE **CacheManager** SHALL maç detayı (match detail) verisini 7200 saniye TTL ile önbelleklemek.
5. THE **CacheManager** SHALL profil verisini (oyuncu + maçlar birleşik) 600 saniye TTL ile önbelleklemek.
6. WHEN Redis bağlantısı kurulamazsa, THE **CacheManager** SHALL in-memory Map tabanlı fallback önbelleğe geçmek.
7. WHEN bir önbellek anahtarı için veri bulunursa, THE **CacheManager** SHALL `cached: true` bayrağını yanıta eklemek.
8. THE **CacheManager** SHALL önbellek anahtarlarını `{veriTipi}:{oyuncuAdı}:{tag}` formatında oluşturmak.
9. WHEN 429 (rate limit) hatası alınırsa, THE **CacheManager** SHALL hata yanıtını 120 saniye TTL ile önbelleklemek.
10. THE **CacheManager** SHALL Redis bağlantı hatalarını sessizce yakalayıp in-memory fallback'e geçmek; hata fırlatmamak.

---

### Gereksinim 2: Rate Limiter Koruma Katmanı

**Kullanıcı Hikayesi:** Bir platform yöneticisi olarak, kötü niyetli veya aşırı istek gönderen istemcilerin backend'i ve dış API kotasını tüketmesini engellemek istiyorum.

#### Kabul Kriterleri

1. THE **RateLimiter** SHALL her istemci IP adresi için 60 saniyelik pencerede maksimum 30 istek sınırı uygulamak.
2. WHEN bir istemci istek limitini aşarsa, THE **RateLimiter** SHALL `429 Too Many Requests` HTTP yanıtı döndürmek.
3. WHEN 429 yanıtı döndürülürse, THE **RateLimiter** SHALL `Retry-After` başlığını saniye cinsinden yanıta eklemek.
4. THE **RateLimiter** SHALL istek sayacını Redis'te `ratelimit:{ip}` anahtarıyla saklamak.
5. WHEN Redis kullanılamıyorsa, THE **RateLimiter** SHALL in-memory Map ile istek sayımını sürdürmek.
6. THE **RateLimiter** SHALL `/api/valorant`, `/api/player`, `/api/matches`, `/api/leaderboard` rotalarına uygulanmak.
7. WHERE Vercel deployment ortamı aktifse, THE **RateLimiter** SHALL `x-forwarded-for` başlığından gerçek istemci IP'sini okumak.
8. THE **RateLimiter** SHALL Next.js middleware katmanında çalışmak; her route handler'ı ayrı ayrı değiştirmemek.

---

### Gereksinim 3: Controller / Service Katman Ayrımı

**Kullanıcı Hikayesi:** Bir backend geliştirici olarak, iş mantığının route handler'lardan ayrılmasını istiyorum; böylece her katman tek bir sorumluluğa sahip olsun ve test edilebilirlik artsın.

#### Kabul Kriterleri

1. THE **ApiGateway** SHALL HenrikDev API çağrılarını (`hGet`) tek bir servis sınıfında toplamak.
2. THE **ApiGateway** SHALL Riot Official API çağrılarını ayrı bir metot grubu altında toplamak.
3. THE **ApiGateway** SHALL dış API yanıtlarını `TransformedMatch` ve `TransformedPlayer` tiplerine dönüştürmek.
4. WHEN bir route handler veri talep ederse, THE **ApiGateway** SHALL önce önbelleği kontrol etmek, önbellekte yoksa dış API'yi çağırmak.
5. THE **MatchProcessor** SHALL ham maç verisini alıp normalize edilmiş `TransformedMatch` nesnesi döndürmek.
6. THE **MatchProcessor** SHALL tek bir maç için oyuncu istatistiklerini (ACS, ADR, K/D, headshot %) hesaplamak.
7. THE **MatchProcessor** SHALL silah bazlı kill dağılımını maç verisinden çıkarmak.
8. THE **MatchProcessor** SHALL Clean Code prensiplerine uygun olarak her metodu tek bir sorumluluğa sahip tutmak; bir metot 30 satırı geçmemek.
9. WHEN route handler bir hata alırsa, THE **ApiGateway** SHALL hatayı standart `{ error: string, status: number }` formatına dönüştürmek.

---

### Gereksinim 4: Gelişmiş İstatistik Hesaplama Motoru (StatsEngine)

**Kullanıcı Hikayesi:** Bir Valorant oyuncusu olarak, sadece K/D değil; ekonomi yönetimi, clutch başarısı ve ajan bazlı performans gibi derinlemesine analizlere erişmek istiyorum.

#### Kabul Kriterleri

1. THE **StatsEngine** SHALL ekonomi analizini hesaplamak: full buy (≥3900 kredi), force buy (1000–3899 kredi) ve eco (<1000 kredi) tur kategorilerini ayrı ayrı win rate ile raporlamak.
2. THE **StatsEngine** SHALL her ekonomi kategorisi için win rate'i yüzde (0–100) olarak döndürmek.
3. THE **StatsEngine** SHALL clutch senaryolarını (1v1, 1v2, 1v3, 1v4, 1v5) ayrı ayrı takip etmek ve her senaryo için toplam deneme ve kazanma sayısını raporlamak.
4. THE **StatsEngine** SHALL clutch rating'i 0–100 arasında sayısal bir skor olarak hesaplamak; 1v3+ senaryolar daha yüksek ağırlık taşımak.
5. THE **StatsEngine** SHALL ajan bazlı performansı hesaplamak: her ajan için oynanan maç sayısı, win rate, ortalama ACS, K/D/A değerlerini raporlamak.
6. THE **StatsEngine** SHALL tilt skorunu 0–100 arasında hesaplamak; son 5 maçın win rate'i, K/D trendi ve ACS ortalamasını girdi olarak kullanmak.
7. THE **StatsEngine** SHALL duo sinerji skorunu 0–100 arasında hesaplamak; birlikte oynanan maç sayısı, win rate ve ortalama K/D'yi girdi olarak kullanmak.
8. WHEN bir oyuncu için yeterli maç verisi yoksa (< 3 maç), THE **StatsEngine** SHALL hesaplama yapmak yerine `insufficient_data: true` bayrağını döndürmek.
9. THE **StatsEngine** SHALL tüm hesaplama metodlarını saf fonksiyon (pure function) olarak uygulamak; yan etki içermemek.

---

### Gereksinim 5: Dinamik DevLog Sistemi

**Kullanıcı Hikayesi:** Bir geliştirici olarak, devlog içeriğini kod değiştirmeden JSON veya Markdown dosyaları üzerinden yönetebilmek istiyorum; böylece yeni sürüm notları eklemek için deploy gerekmez.

#### Kabul Kriterleri

1. THE **DevlogManager** SHALL devlog girişlerini `content/devlog/` dizinindeki JSON veya Markdown dosyalarından okumak.
2. THE **DevlogManager** SHALL her devlog girişi için zorunlu alanları doğrulamak: `version` (semver formatı), `date` (ISO 8601), `title` (string), `category` (api | ui | security | performance), `items` (dizi).
3. THE **DevlogManager** SHALL girişleri `date` alanına göre azalan sırada (en yeni önce) sıralamak.
4. WHEN bir devlog dosyası geçersiz format içeriyorsa, THE **DevlogManager** SHALL o girişi atlamak ve konsola uyarı loglamak; diğer girişleri etkilememek.
5. THE **DevlogManager** SHALL devlog listesini 3600 saniye TTL ile önbelleklemek.
6. THE **DevlogManager** SHALL her item için `status` alanını desteklemek: `done`, `progress`, `planned`.
7. THE **DevlogManager** SHALL `version` alanını semver formatında doğrulamak (`vX.Y.Z` deseni).
8. WHEN devlog dizini boşsa veya bulunamazsa, THE **DevlogManager** SHALL boş dizi döndürmek; hata fırlatmamak.

---

### Gereksinim 6: API Güvenliği ve Vercel Deployment Kuralları

**Kullanıcı Hikayesi:** Bir platform yöneticisi olarak, API anahtarlarının kaynak kodda veya istemci tarafında açığa çıkmamasını ve Vercel ortamında güvenli çalışmasını istiyorum.

#### Kabul Kriterleri

1. THE **System** SHALL `HENRIK_API_KEY`, `RIOT_API_KEY`, `DATABASE_URL`, `REDIS_URL` değerlerini yalnızca sunucu tarafı ortam değişkenlerinden okumak; istemci bundle'ına dahil etmemek.
2. THE **System** SHALL `NEXT_PUBLIC_` öneki taşımayan tüm ortam değişkenlerini sunucu tarafında tutmak.
3. THE **System** SHALL Vercel `vercel.json` dosyasında `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block` güvenlik başlıklarını tanımlamak.
4. THE **System** SHALL API route'larında gelen isteklerin `Content-Type` başlığını doğrulamak; beklenmeyen içerik türlerini reddetmek.
5. WHEN `RIOT_API_KEY` ortam değişkeni tanımlı değilse, THE **System** SHALL HenrikDev API'ye otomatik olarak geçmek; hata fırlatmamak.
6. THE **System** SHALL `.env.local` dosyasını `.gitignore` kapsamında tutmak; versiyon kontrolüne dahil etmemek.
7. THE **System** SHALL cron job rotalarını (`/api/cron/*`) `CRON_SECRET` ortam değişkeni ile korumak; yetkisiz çağrıları `401 Unauthorized` ile reddetmek.

---

### Gereksinim 7: Hata Yönetimi — Retry Logic ve Fallback Mekanizmaları

**Kullanıcı Hikayesi:** Bir platform kullanıcısı olarak, dış API geçici olarak yanıt vermediğinde veya rate limit aşıldığında uygulamanın çökmemesini ve mümkünse eski veriyi göstermesini istiyorum.

#### Kabul Kriterleri

1. WHEN HenrikDev veya Riot API 429 döndürürse, THE **RetryHandler** SHALL 2 saniye bekleyip isteği en fazla 2 kez yeniden denemek.
2. WHEN yeniden denemeler de başarısız olursa, THE **RetryHandler** SHALL Redis önbelleğindeki son geçerli veriyi döndürmek.
3. WHEN önbellekte de veri yoksa, THE **RetryHandler** SHALL MongoDB'den en son kaydedilmiş oyuncu verisini döndürmek.
4. WHEN MongoDB'de de veri yoksa, THE **RetryHandler** SHALL `{ error: string, retryAfter: number }` formatında 429 yanıtı döndürmek.
5. WHEN HenrikDev API 500 döndürürse, THE **RetryHandler** SHALL 1 saniye bekleyip isteği en fazla 1 kez yeniden denemek.
6. THE **RetryHandler** SHALL her yeniden deneme girişimini `[RetryHandler] attempt {n}/{max}: {url}` formatında konsola loglamak.
7. WHEN stale (bayat) önbellek verisi döndürülürse, THE **System** SHALL yanıta `stale: true` ve `warning: string` alanlarını eklemek.
8. THE **System** SHALL tüm API hata yanıtlarını standart `{ error: string, status: number, retryAfter?: number }` formatında döndürmek.
9. IF bir route handler beklenmedik bir istisna fırlatırsa, THEN THE **System** SHALL hatayı loglamak ve `500 Internal Server Error` döndürmek; stack trace'i istemciye göndermemek.

---

### Gereksinim 8: MatchProcessor Servis Dosyası

**Kullanıcı Hikayesi:** Bir backend geliştirici olarak, maç verisi işleme mantığının tek bir, iyi organize edilmiş servis dosyasında toplanmasını istiyorum; böylece `transformer.ts` ve `stats-processor.ts` arasındaki sorumluluk karmaşası ortadan kalksın.

#### Kabul Kriterleri

1. THE **MatchProcessor** SHALL `lib/match-processor.ts` dosyasında tanımlanmak.
2. THE **MatchProcessor** SHALL `processMatch(rawMatch: unknown): TransformedMatch` metodunu dışa aktarmak.
3. THE **MatchProcessor** SHALL `processPlayerStats(match: TransformedMatch, puuid: string): PlayerMatchStats` metodunu dışa aktarmak.
4. THE **MatchProcessor** SHALL `processWeaponKills(kills: unknown[], puuid: string): Record<string, number>` metodunu dışa aktarmak.
5. THE **MatchProcessor** SHALL `processLifetimeStats(matches: TransformedMatch[], name: string, tag: string): LifetimeStats` metodunu dışa aktarmak.
6. THE **MatchProcessor** SHALL mevcut `transformer.ts` ve `stats-processor.ts` dosyalarıyla geriye dönük uyumlu olmak; bu dosyaları silmemek, yalnızca MatchProcessor'ı onların üzerine inşa etmek.
7. THE **MatchProcessor** SHALL TypeScript strict modunda hatasız derlenmek; `any` tip kullanımını minimize etmek.
8. THE **MatchProcessor** SHALL her public metodun JSDoc yorumu içermesini sağlamak.

---

### Gereksinim 9: Genişletilmiş Prisma Şeması

**Kullanıcı Hikayesi:** Bir backend geliştirici olarak, oyuncu verisi yanında maç geçmişi, ajan istatistikleri ve devlog girişlerinin de veritabanında saklanmasını istiyorum; böylece API kotası tükendiğinde tam veri seti sunulabilsin.

#### Kabul Kriterleri

1. THE **System** SHALL `MatchRecord` modelini Prisma şemasına eklemek: `matchId` (unique), `puuid`, `map`, `mode`, `result` (win/loss), `acs`, `kills`, `deaths`, `assists`, `agent`, `startedAt`, `rounds` alanlarıyla.
2. THE **System** SHALL `AgentStats` modelini Prisma şemasına eklemek: `puuid`, `agent`, `played`, `wins`, `avgAcs`, `avgKd`, `updatedAt` alanlarıyla.
3. THE **System** SHALL `DevlogEntry` modelini Prisma şemasına eklemek: `version`, `date`, `title`, `category`, `items` (JSON), `published` alanlarıyla.
4. THE **System** SHALL `Player` modeline `matchCount` ve `lastMatchAt` alanlarını eklemek.
5. THE **System** SHALL `MatchRecord` ile `Player` arasında `puuid` üzerinden ilişki kurmak.
6. THE **System** SHALL `MatchRecord` modeline `puuid` ve `startedAt` üzerinde bileşik index eklemek.
7. THE **System** SHALL `AgentStats` modeline `puuid` ve `agent` üzerinde bileşik unique constraint eklemek.
8. WHEN Prisma şeması değiştirilirse, THE **System** SHALL MongoDB Atlas ile uyumlu `@db.ObjectId` ve `@map("_id")` anotasyonlarını korumak.
