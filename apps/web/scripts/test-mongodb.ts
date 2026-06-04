// MongoDB bağlantısını ve verileri test eden yardımcı script
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  errorFormat: "pretty",
});

async function testMongoDB() {
  console.log("=== MongoDB Bağlantı Testi Başlatılıyor ===\n");

  try {
    // 1. Bağlantıyı test et
    console.log("1. MongoDB bağlantısı kontrol ediliyor...");
    await prisma.$connect();
    console.log("✅ MongoDB bağlantısı başarılı\n");

    // 2. Player sayısını al
    console.log("2. Player kayıtları kontrol ediliyor...");
    const playerCount = await prisma.player.count();
    console.log(`✅ Toplam ${playerCount} oyuncu kaydı bulundu\n`);

    // 3. Son 5 oyuncuyu listele
    if (playerCount > 0) {
      console.log("3. Son eklenen 5 oyuncu:");
      const recentPlayers = await prisma.player.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          name: true,
          tag: true,
          level: true,
          tier: true,
          tierName: true,
          elo: true,
          createdAt: true,
        },
      });

      recentPlayers.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}#${p.tag} - Level ${p.level}, ${p.tierName} (ELO: ${p.elo})`);
      });
      console.log();
    }

    // 4. Örnek arama testi (büyük/küçük harf duyarsız)
    console.log("4. Örnek arama testi yapılıyor...");
    const searchResult = await prisma.player.findFirst({
      where: {
        name: { equals: "test", mode: "insensitive" },
      },
    });
    console.log(`   Arama sonucu: ${searchResult ? "Bulundu" : "Bulunamadı"}\n`);

    // 5. İstatistikler
    console.log("5. Veritabanı istatistikleri:");
    const matchCount = await prisma.matchRecord.count();
    const agentStatsCount = await prisma.agentStats.count();
    console.log(`   - Match kayıtları: ${matchCount}`);
    console.log(`   - Agent istatistikleri: ${agentStatsCount}\n`);

    console.log("=== Test Başarıyla Tamamlandı ===");
  } catch (error) {
    console.error("❌ HATA:", error);
    if (error instanceof Error) {
      console.error("Hata mesajı:", error.message);
      console.error("Stack trace:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Script'i çalıştır
testMongoDB().catch(console.error);
