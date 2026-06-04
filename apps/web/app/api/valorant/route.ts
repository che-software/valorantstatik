// Ana API route — ince controller katmanı
// İş mantığı ApiGateway servisine devredildi; burada sadece istek parse + yanıt formatı var.
import { NextRequest, NextResponse } from "next/server";
import { getProfile, fetchMatches, fetchMatchDetail, buildApiError } from "@/lib/services/api-gateway";

export async function GET(req: NextRequest) {
  const sp     = req.nextUrl.searchParams;
  const action = sp.get("action");

  // ── PROFILE ──────────────────────────────────────────────────────────────
  if (action === "profile") {
    const name = sp.get("name") ?? "";
    const tag  = sp.get("tag")  ?? "";
    if (!name || !tag) {
      return NextResponse.json({ error: "name ve tag gerekli" }, { status: 400 });
    }
    try {
      const result = await getProfile(name, tag);
      return NextResponse.json(result);
    } catch (err) {
      const e = buildApiError(err);
      return NextResponse.json({ error: e.error, retryAfter: e.retryAfter }, { status: e.status });
    }
  }

  // ── MATCHES ───────────────────────────────────────────────────────────────
  if (action === "matches") {
    const name = sp.get("name") ?? "";
    const tag  = sp.get("tag")  ?? "";
    if (!name || !tag) {
      return NextResponse.json({ error: "name ve tag gerekli" }, { status: 400 });
    }
    try {
      const matches = await fetchMatches(name, tag);
      return NextResponse.json({ matches, cached: false });
    } catch (err) {
      const e = buildApiError(err);
      return NextResponse.json({ error: e.error, retryAfter: e.retryAfter }, { status: e.status });
    }
  }

  // ── MATCH DETAIL ──────────────────────────────────────────────────────────
  if (action === "match") {
    const matchId = sp.get("matchId") ?? "";
    if (!matchId) {
      return NextResponse.json({ error: "matchId gerekli" }, { status: 400 });
    }
    try {
      const match = await fetchMatchDetail(matchId);
      return NextResponse.json({ match });
    } catch (err) {
      const e = buildApiError(err);
      return NextResponse.json({ error: e.error, retryAfter: e.retryAfter }, { status: e.status });
    }
  }

  return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
}
