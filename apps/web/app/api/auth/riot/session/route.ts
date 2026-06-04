import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("rso_session")?.value;

  if (!raw) return NextResponse.json({ authenticated: false });

  try {
    const s = JSON.parse(raw) as {
      puuid:     string | null;
      gameName:  string | null;
      tagLine:   string | null;
      level:     number;
      cardUrl:   string;
      rankTier:  number;
      rankName:  string;
      rankIcon:  string;
      rr:        number;
      expiresAt: number;
    };

    if (s.expiresAt < Date.now()) {
      cookieStore.delete("rso_session");
      return NextResponse.json({ authenticated: false, reason: "expired" });
    }

    return NextResponse.json({
      authenticated: true,
      puuid:    s.puuid,
      gameName: s.gameName,
      tagLine:  s.tagLine,
      level:    s.level    ?? 0,
      cardUrl:  s.cardUrl  ?? "",
      rankTier: s.rankTier ?? 0,
      rankName: s.rankName ?? "Unranked",
      rankIcon: s.rankIcon ?? "",
      rr:       s.rr       ?? 0,
    });
  } catch {
    return NextResponse.json({ authenticated: false, reason: "invalid_session" });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("rso_session");
  return NextResponse.json({ success: true });
}
