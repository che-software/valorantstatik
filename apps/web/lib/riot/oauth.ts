import { RIOT_TOKEN_URL, RIOT_USERINFO_URL, riotAccountMeUrl } from "@/lib/riot/constants";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface RiotUserInfo {
  sub?: string;
  [key: string]: unknown;
}

export interface ExchangeCodeParams {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret?: string;
  codeVerifier?: string;
}

/**
 * Authorization code → access token.
 * Riot “Client Secret Basic” için Authorization: Basic base64(client_id:client_secret)
 * PKCE kullanılıyorsa code_verifier gönderilir.
 */
export async function exchangeAuthorizationCode(p: ExchangeCodeParams): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: p.code,
    redirect_uri: p.redirectUri,
  });
  if (p.codeVerifier) body.set("code_verifier", p.codeVerifier);
  if (!p.clientSecret) body.set("client_id", p.clientId);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (p.clientSecret) {
    const basic = Buffer.from(`${p.clientId}:${p.clientSecret}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }

  const res = await fetch(RIOT_TOKEN_URL, { method: "POST", headers, body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as TokenResponse;
}

export async function refreshAccessToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret?: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (params.clientSecret) {
    const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`, "utf8").toString("base64");
    headers.Authorization = `Basic ${basic}`;
  } else {
    body.set("client_id", params.clientId);
  }

  const res = await fetch(RIOT_TOKEN_URL, { method: "POST", headers, body });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Refresh failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as TokenResponse;
}

export async function fetchUserInfo(accessToken: string): Promise<RiotUserInfo> {
  const res = await fetch(RIOT_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`userinfo failed (${res.status}): ${t.slice(0, 300)}`);
  }
  return (await res.json()) as RiotUserInfo;
}

/** VALORANT için önerilen cluster ile Riot Account “me” */
export async function fetchValorantAccountMe(accessToken: string, cluster: string): Promise<unknown> {
  const url = riotAccountMeUrl(cluster);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`accounts/me failed (${res.status}): ${text.slice(0, 300)}`);
  return JSON.parse(text) as unknown;
}
