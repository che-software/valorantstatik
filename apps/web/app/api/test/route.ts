import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const diagnostics = {
    ok: true,
    timestamp: new Date().toISOString(),
    mongodb: { connected: false, error: null as string | null },
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 20) + "...",
    },
    playerCount: 0,
  };

  try {
    // MongoDB bağlantısını test et
    await prisma.$connect();
    diagnostics.mongodb.connected = true;

    // Player sayısını al
    const count = await prisma.player.count();
    diagnostics.playerCount = count;

    console.log("[Test] MongoDB bağlantısı başarılı, Player sayısı:", count);
  } catch (error) {
    diagnostics.mongodb.connected = false;
    diagnostics.mongodb.error = error instanceof Error ? error.message : String(error);
    console.error("[Test] MongoDB hatası:", error);
  }

  return NextResponse.json(diagnostics);
}
