/** Riot Sign-On (OAuth 2.0) ve REST taban adresleri */
export const RIOT_AUTH_BASE = "https://auth.riotgames.com";
export const RIOT_AUTHORIZE_URL = `${RIOT_AUTH_BASE}/authorize`;
export const RIOT_TOKEN_URL = `${RIOT_AUTH_BASE}/token`;
export const RIOT_USERINFO_URL = `${RIOT_AUTH_BASE}/userinfo`;

/** VALORANT / Account v1 — Bearer access token ile kimlik (Riot dokümantasyonu) */
export function riotAccountMeUrl(cluster: string): string {
  const c = cluster.toLowerCase();
  return `https://${c}.api.riotgames.com/riot/account/v1/accounts/me`;
}
