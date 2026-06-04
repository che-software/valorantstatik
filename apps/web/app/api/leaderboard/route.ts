// Leaderboard route — ince controller katmanı
// Veri çekme ve önbellekleme ApiGateway'e devredildi.
import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, buildApiError } from "@/lib/services/api-gateway";
import { getRankIcon, getRankInfo } from "@/lib/rank-map";

export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams;
  const region = (sp.get("region") ?? "eu").toLowerCase();
  const page   = Math.max(1, parseInt(sp.get("page") ?? "1"));

  try {
    const raw = await fetchLeaderboard(region, page);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players = (raw.players as any[]).map((p: any) => {
      const tier     = p.competitiveTier ?? 27;
      const rankInfo = getRankInfo(tier);
      return {
        rank:        p.leaderboardRank,
        puuid:       p.puuid        ?? "",
        name:        p.gameName     ?? "—",
        tag:         p.tagLine      ?? "—",
        rr:          p.rankedRating ?? 0,
        wins:        p.numberOfWins ?? 0,
        tier,
        tierName:    rankInfo.name,
        rankIconUrl: getRankIcon(tier),
        cardSmall:   "",
        isAnonymous: p.IsAnonymized ?? p.isAnonymized ?? false,
        isBanned:    p.IsBanned     ?? p.isBanned     ?? false,
      };
    });

    return NextResponse.json({
      players,
      region,
      page,
      total:      raw.total,
      lastUpdate: raw.lastUpdate,
      cached:     false,
    });
  } catch (err) {
    const e = buildApiError(err);
    return NextResponse.json({ error: e.error, retryAfter: e.retryAfter }, { status: e.status });
  }
}
