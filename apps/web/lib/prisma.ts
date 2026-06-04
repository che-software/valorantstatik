import { PrismaClient } from "@prisma/client";
import dns from "dns";

// System DNS sometimes fails to resolve MongoDB SRV records.
// Force Google/Cloudflare DNS to ensure reliable Atlas connectivity.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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

