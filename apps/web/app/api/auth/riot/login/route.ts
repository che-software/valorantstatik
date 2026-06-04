// Riot RSO — OAuth2 login başlatma
// Kullanıcıyı Riot'un yetkilendirme sayfasına yönlendirir
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const RIOT_AUTH_URL = "https://auth.riotgames.com/authorize";

export async function GET() {
  const clientId    = process.env.RIOT_RSO_CLIENT_ID;
  const redirectUri = process.env.RIOT_RSO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("[RSO Login] RIOT_RSO_CLIENT_ID veya RIOT_RSO_REDIRECT_URI tanımlı değil");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/?rso_error=server_config`);
  }

  // CSRF koruması için state parametresi
  const state = crypto.randomBytes(16).toString("hex");

  // State'i httpOnly cookie'ye kaydet (30 dakika geçerli)
  const cookieStore = await cookies();
  cookieStore.set("rso_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 30,
    path:     "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    // account scope: game_name + tag_line döndürür
    // openid: sub (puuid) döndürür
    scope:         "openid account",
    state,
  });

  return NextResponse.redirect(`${RIOT_AUTH_URL}?${params.toString()}`);
}
