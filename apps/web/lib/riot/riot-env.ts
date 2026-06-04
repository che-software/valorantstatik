import "@/lib/riot/load-env";

export const COOKIE_PENDING = "riot_oauth_pending";
export const COOKIE_SESSION = "riot_oauth_sess";

export interface RiotOAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string;
  cluster: string;
  usePkce: boolean;
  stateSecret: string;
  sessionPassword: string;
  successRedirect: string;
}

function pick(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function readRiotOAuthConfig(): { ok: true; value: RiotOAuthConfig } | { ok: false; missing: string[] } {
  const missing: string[] = [];

  const clientId = pick("RIOT_RSO_CLIENT_ID");
  const redirectUri = pick("RIOT_RSO_REDIRECT_URI");
  const stateSecret = pick("RIOT_OAUTH_STATE_SECRET");
  const sessionPassword = pick("RIOT_SESSION_ENCRYPTION_PASSWORD");

  if (!clientId) missing.push("RIOT_RSO_CLIENT_ID");
  if (!redirectUri) missing.push("RIOT_RSO_REDIRECT_URI");
  if (!stateSecret) missing.push("RIOT_OAUTH_STATE_SECRET");
  else if (stateSecret.length < 16) missing.push("RIOT_OAUTH_STATE_SECRET (en az 16 karakter)");
  if (!sessionPassword) missing.push("RIOT_SESSION_ENCRYPTION_PASSWORD");
  else if (sessionPassword.length < 16) missing.push("RIOT_SESSION_ENCRYPTION_PASSWORD (en az 16 karakter)");

  if (missing.length) return { ok: false, missing };

  return {
    ok: true,
    value: {
      clientId: clientId!,
      clientSecret: pick("RIOT_RSO_CLIENT_SECRET"),
      redirectUri: redirectUri!,
      scopes: pick("RIOT_RSO_SCOPES") ?? "openid offline_access",
      cluster: pick("RIOT_VAL_CLUSTER") ?? "americas",
      usePkce: pick("RIOT_RSO_USE_PKCE") !== "false",
      stateSecret: stateSecret!,
      sessionPassword: sessionPassword!,
      successRedirect: pick("RIOT_OAUTH_SUCCESS_REDIRECT") ?? "/",
    },
  };
}
