// Cron job — DB'deki oyuncuları saatte bir günceller
// Vercel tarafından otomatik tetiklenir, dışarıdan erişim CRON_SECRET ile korunur
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { transformPlayer } from "@/lib/transformer";
import { cacheSet } from "@/lib/redis";

const HENRIK_BASE = "https://api.henrikdev.xyz/valorant";
const HENRIK_KEY  = process.env.HENRIK_API_KEY ?? "";
const BATCH_SIZE  = 5;   // aynı anda 5 oyuncu (rate limit koruması)
const DELAY_MS    = 2000; // her batch arasında 2 saniye bekle

async function hGet(path: string) {
  const res = await axios.get(`${HENRIK_BASE}${path}`, {
    headers: { Authorization: HENRIK_KEY },
    timeout: 12000,
  });
  return res.data;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function GET(req: NextRequest) {
  // Güvenlik: CRON_SECRET zorunlu — tanımsızsa veya eşleşmiyorsa 401
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  let updated = 0, failed = 0, skipped = 0;

  try {
    const { prisma } = await import("@/lib/prisma");

    // Son 7 günde aratılmış oyuncuları al, ELO'ya göre sırala (önemli oyuncular önce)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const players = await prisma.player.findMany({
      where: { updatedAt: { gte: cutoff } },
      orderBy: { elo: "desc" },
      take: 100, // saatte max 100 oyuncu
      select: { puuid: true, name: true, tag: true, region: true },
    });

    console.log(`[Cron] ${players.length} oyuncu güncellenecek`);

    // Batch'ler halinde işle
    for (let i = 0; i < players.length; i += BATCH_SIZE) {
      const batch = players.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (p) => {
          try {
            const n = encodeURIComponent(p.name);
            const t = encodeURIComponent(p.tag);
            const r = p.region.toLowerCase();

            const [accountRes, rankRes] = await Promise.allSettled([
              hGet(`/v1/account/${n}/${t}`),
              hGet(`/v2/mmr/${r}/${n}/${t}`),
            ]);

            if (accountRes.status === "rejected") { failed++; return; }

            const accountRaw = accountRes.value?.data;
            const rankRaw    = rankRes.status === "fulfilled" ? rankRes.value?.data ?? null : null;

            const player = transformPlayer(accountRaw, rankRaw);
            const elo    = player.rank?.elo ?? 0;

            // DB güncelle
            await prisma.player.update({
              where: { puuid: p.puuid },
              data: {
                level: player.level,
                tier:        player.rank?.tier     ?? 0,
                tierName:    player.rank?.name      ?? "Unranked",
                elo,
                rr:          player.rank?.rr        ?? 0,
                rrChange:    player.rank?.rrChange   ?? 0,
                rankIconUrl: player.rank?.iconUrl    ?? "",
                cardSmall:   player.card?.small      ?? "",
              },
            });

            // Redis cache'i de temizle (bir sonraki ziyarette taze veri gelsin)
            await cacheSet(
              `profile:${p.name.toLowerCase()}:${p.tag.toLowerCase()}`,
              { player, matches: [] },
              60 // 1 dakika — kısa tutuyoruz ki profil sayfası yeni veri çeksin
            );

            updated++;
          } catch (e) {
            const status = (e as { response?: { status?: number } })?.response?.status;
            if (status === 404) skipped++; // oyuncu silinmiş
            else failed++;
          }
        })
      );

      // Rate limit koruması — her batch sonrası bekle
      if (i + BATCH_SIZE < players.length) {
        await sleep(DELAY_MS);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Cron] Tamamlandı: ${updated} güncellendi, ${failed} hata, ${skipped} atlandı (${duration}s)`);

    return NextResponse.json({
      success: true,
      updated,
      failed,
      skipped,
      total: players.length,
      duration: `${duration}s`,
    });
  } catch (err) {
    console.error("[Cron] Fatal error:", err);
    return NextResponse.json({ error: "Cron başarısız" }, { status: 500 });
  }
}
