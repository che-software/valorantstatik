import { NextRequest, NextResponse } from "next/server";
import "@/lib/riot/load-env";
import { fetchValorantAccountMe, refreshAccessToken } from "@/lib/riot/oauth";
import { decryptSessionJson, encryptSessionJson } from "@/lib/riot/session-cookie";
import { COOKIE_SESSION, readRiotOAuthConfig } from "@/lib/riot/riot-env";
import { riotCookieDefaults } from "@/lib/riot/cookie-options";

export const dynamic = "force-dynamic";

type SessionPayload = {
  access_token: string;
  refresh_token?: string;
  access_expires_at: number;
};

export async function GET(req: NextRequest) {
  const cfg = readRiotOAuthConfig();
  if (!cfg.ok) {
    return NextResponse.json({ error: "RSO yapılandırması eksik", missing: cfg.missing }, { status: 503 });
  }
  const c = cfg.value;

  const raw = req.cookies.get(COOKIE_SESSION)?.value;
  if (!raw) return NextResponse.json({ authenticated: false }, { status: 401 });

  let session = decryptSessionJson<SessionPayload>(raw, c.sessionPassword);
  if (!session?.access_token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const skew = 60_000;
  if (session.access_expires_at < Date.now() + skew && session.refresh_token) {
    try {
      const t = await refreshAccessToken({
        refreshToken: session.refresh_token,
        clientId: c.clientId,
        clientSecret: c.clientSecret,
      });
      session = {
        access_token: t.access_token,
        refresh_token: t.refresh_token ?? session.refresh_token,
        access_expires_at: Date.now() + (t.expires_in ?? 3600) * 1000,
      };
      const sealed = encryptSessionJson(session, c.sessionPassword);
      let me: unknown = null;
      let warn: string | undefined;
      try {
        me = await fetchValorantAccountMe(session.access_token, c.cluster);
      } catch (e) {
        warn = e instanceof Error ? e.message : String(e);
      }
      const res = NextResponse.json({
        authenticated: true,
        refreshed: true,
        account: me,
        ...(warn ? { warning: warn } : {}),
      });
      res.cookies.set(COOKIE_SESSION, sealed, { ...riotCookieDefaults(), maxAge: 60 * 60 * 24 * 7 });
      return res;
    } catch {
      return NextResponse.json({ authenticated: false, error: "refresh_failed" }, { status: 401 });
    }
  }

  try {
    const me = await fetchValorantAccountMe(session.access_token, c.cluster);
    return NextResponse.json({ authenticated: true, refreshed: false, account: me });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ authenticated: true, account: null, warning: msg });
  }
}
