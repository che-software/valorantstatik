// Riot RSO — OAuth2 callback & token exchange
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const TOKEN_URL    = "https://auth.riotgames.com/token";
const USERINFO_URL = "https://auth.riotgames.com/userinfo";
const HENRIK_BASE  = "https://api.henrikdev.xyz/valorant";
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? "https://kedipotter-tracker.vercel.app";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[RSO Callback] Riot hata:", error);
    return NextResponse.redirect(`${APP_URL}/?rso_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/?rso_error=missing_params`);
  }

  const cookieStore = await cookies();
  const savedState  = cookieStore.get("rso_state")?.value;

  if (!savedState || savedState !== state) {
    cookieStore.delete("rso_state");
    return NextResponse.redirect(`${APP_URL}/?rso_error=state_mismatch`);
  }
  cookieStore.delete("rso_state");

  const clientId     = process.env.RIOT_RSO_CLIENT_ID;
  const clientSecret = process.env.RIOT_RSO_CLIENT_SECRET;
  const redirectUri  = process.env.RIOT_RSO_REDIRECT_URI;
  const henrikKey    = process.env.HENRIK_API_KEY ?? "";

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${APP_URL}/?rso_error=server_config`);
  }

  // ── Token exchange ────────────────────────────────────────────────────────
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tokenData: any;
  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method:  "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type":  "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }).toString(),
    });
    const raw = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("[RSO Callback] Token exchange başarısız:", raw);
      return NextResponse.redirect(`${APP_URL}/?rso_error=${encodeURIComponent(raw?.error ?? "token_exchange_failed")}`);
    }
    tokenData = raw;
  } catch (err) {
    console.error("[RSO Callback] Token exchange network hatası:", err);
    return NextResponse.redirect(`${APP_URL}/?rso_error=network_error`);
  }

  // ── UserInfo ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userInfo: any = {};
  try {
    const r = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (r.ok) {
      userInfo = await r.json();
      console.log("[RSO Callback] UserInfo keys:", Object.keys(userInfo).join(", "));
      console.log("[RSO Callback] UserInfo acct:", JSON.stringify(userInfo.acct));
      console.log("[RSO Callback] UserInfo sub:", userInfo.sub);
    } else {
      console.warn("[RSO Callback] UserInfo HTTP:", r.status);
    }
  } catch (e) {
    console.warn("[RSO Callback] UserInfo hata:", e);
  }

  // gameName/tagLine — acct scope'u varsa oradan, yoksa HenrikDev'den puuid ile çek
  let gameName: string | null = userInfo.acct?.game_name ?? userInfo.game_name ?? null;
  let tagLine:  string | null = userInfo.acct?.tag_line  ?? userInfo.tag_line  ?? null;
  const puuid: string | null  = userInfo.sub ?? null;

  // ── HenrikDev'den profil bilgisi ─────────────────────────────────────────
  let level    = 0;
  let cardUrl  = "";
  let rankTier = 0;
  let rankName = "Unranked";
  let rankIcon = "";
  let rr       = 0;
  let region   = "eu";

  // Önce puuid ile isim çek (gameName null ise)
  if (!gameName && puuid) {
    try {
      const r = await fetch(`${HENRIK_BASE}/v1/by-puuid/account/${puuid}`, {
        headers: { Authorization: henrikKey },
      });
      if (r.ok) {
        const j = await r.json();
        const d = j?.data ?? j;
        gameName = d?.name ?? null;
        tagLine  = d?.tag  ?? null;
        console.log("[RSO Callback] PUUID lookup:", gameName, tagLine);
      }
    } catch (e) {
      console.warn("[RSO Callback] PUUID lookup hata:", e);
    }
  }

  // gameName varsa account + MMR çek
  if (gameName && tagLine) {
    const n = encodeURIComponent(gameName);
    const t = encodeURIComponent(tagLine);

    try {
      const accR = await fetch(`${HENRIK_BASE}/v1/account/${n}/${t}`, {
        headers: { Authorization: henrikKey },
      });
      if (accR.ok) {
        const j = await accR.json();
        const d = j?.data ?? j;
        region = d?.region ?? "eu";
        level  = d?.account_level ?? 0;
        if (d?.card && typeof d.card === "object") {
          cardUrl = d.card.small ?? "";
        } else if (d?.card && typeof d.card === "string") {
          cardUrl = `https://media.valorant-api.com/playercards/${d.card}/smallart.png`;
        }
      }
    } catch { /* devam */ }

    try {
      const mmrR = await fetch(`${HENRIK_BASE}/v2/mmr/${region}/${n}/${t}`, {
        headers: { Authorization: henrikKey },
      });
      if (mmrR.ok) {
        const j = await mmrR.json();
        const m = j?.data ?? j;
        rankTier = m?.currenttier ?? 0;
        rankName = m?.currenttierpatched ?? "Unranked";
        rr       = m?.ranking_in_tier ?? 0;
        const UUID = "03621f52-342b-cf4e-4f86-9350a49c6d04";
        const tier = rankTier <= 2 ? 0 : rankTier;
        rankIcon = `https://media.valorant-api.com/competitivetiers/${UUID}/${tier}/largeicon.png`;
      }
    } catch { /* devam */ }
  }

  console.log("[RSO Callback] Final:", { gameName, tagLine, puuid, level, cardUrl: !!cardUrl, rankName });

  // ── Session cookie ────────────────────────────────────────────────────────
  const sessionPayload = JSON.stringify({
    accessToken: tokenData.access_token,
    puuid,
    gameName,
    tagLine,
    level,
    cardUrl,
    rankTier,
    rankName,
    rankIcon,
    rr,
    expiresAt: Date.now() + (tokenData.expires_in as number) * 1000,
  });

  cookieStore.set("rso_session", sessionPayload, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   tokenData.expires_in as number,
    path:     "/",
  });

  // gameName varsa direkt profile git, yoksa success ile ana sayfaya
  if (gameName && tagLine) {
    return NextResponse.redirect(
      `${APP_URL}/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
  }
  return NextResponse.redirect(`${APP_URL}/?rso_success=1`);
}
