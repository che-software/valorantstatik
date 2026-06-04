// ConsentService — Kullanıcı veri paylaşım izni (RSO / Riot politikaları ile uyumlu opt-in)
// puuid bazlı opt-in/opt-out kontrolü.

export interface ConsentStatus {
  isOptedIn:  boolean;
  optInDate:  Date | null;
  optOutDate: Date | null;
}

/**
 * Bir oyuncunun veri paylaşım iznini kontrol eder.
 * Kayıt yoksa → opted-out sayılır (gizlilik öncelikli).
 */
export async function getConsentStatus(puuid: string): Promise<ConsentStatus> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const record = await prisma.userConsent.findUnique({ where: { puuid } });
    if (!record) return { isOptedIn: false, optInDate: null, optOutDate: null };
    return {
      isOptedIn:  record.isOptedIn,
      optInDate:  record.optInDate,
      optOutDate: record.optOutDate,
    };
  } catch {
    // DB hatası → güvenli taraf: opted-out
    return { isOptedIn: false, optInDate: null, optOutDate: null };
  }
}

/**
 * Oyuncunun veri paylaşımına izin vermesini kaydeder.
 */
export async function optIn(puuid: string, riotId: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.userConsent.upsert({
    where:  { puuid },
    update: { isOptedIn: true, optInDate: new Date(), optOutDate: null },
    create: { puuid, riotId, isOptedIn: true, optInDate: new Date() },
  });
}

/**
 * Oyuncunun veri paylaşım iznini kaldırır.
 */
export async function optOut(puuid: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.userConsent.upsert({
    where:  { puuid },
    update: { isOptedIn: false, optOutDate: new Date() },
    create: { puuid, riotId: "", isOptedIn: false, optOutDate: new Date() },
  });
}
