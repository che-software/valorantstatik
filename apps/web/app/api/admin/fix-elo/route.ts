import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Admin secret kontrolü (middleware'den geçmiş olsa da double-check)
  const secret = req.headers.get("x-admin-secret");
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const players = await prisma.player.findMany({ where: { tier: { gt: 0 }, elo: 0 } });

    let fixed = 0;
    for (const p of players) {
      const elo = (p.tier - 2) * 100 + p.rr;
      await prisma.player.update({ where: { id: p.id }, data: { elo } });
      fixed++;
    }

    return NextResponse.json({ fixed, message: `${fixed} oyuncunun ELO'su güncellendi.` });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
