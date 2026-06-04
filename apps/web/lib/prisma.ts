import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ 
  log: ["error", "warn"],
  errorFormat: "pretty"
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// MongoDB bağlantısını test et
prisma.$connect()
  .then(() => console.log("[Prisma] MongoDB bağlantısı başarılı"))
  .catch((e) => console.error("[Prisma] MongoDB bağlantı hatası:", e));

