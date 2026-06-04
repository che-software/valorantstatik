// Consent API — Opt-in / Opt-out yönetimi
// GET  /api/consent?puuid=xxx  → izin durumunu sorgula
// POST /api/consent             → { puuid, riotId, action: "opt-in" | "opt-out" }
import { NextRequest, NextResponse } from "next/server";
import { getConsentStatus, optIn, optOut } from "@/lib/services/consent-service";

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid") ?? "";
  if (!puuid) return NextResponse.json({ error: "puuid gerekli" }, { status: 400 });

  const status = await getConsentStatus(puuid);
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  try {
    const { puuid, riotId, action } = await req.json() as {
      puuid:  string;
      riotId: string;
      action: "opt-in" | "opt-out";
    };

    if (!puuid || !action) {
      return NextResponse.json({ error: "puuid ve action gerekli" }, { status: 400 });
    }

    if (action === "opt-in") {
      await optIn(puuid, riotId ?? "");
      return NextResponse.json({ success: true, isOptedIn: true });
    }

    if (action === "opt-out") {
      await optOut(puuid);
      return NextResponse.json({ success: true, isOptedIn: false });
    }

    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  } catch (err) {
    console.error("[Consent]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
