"use client";
import {
  createContext, useContext, useEffect, useState,
  useCallback, ReactNode,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

export interface RsoSession {
  authenticated: true;
  puuid:    string | null;
  gameName: string | null;
  tagLine:  string | null;
  level:    number;
  cardUrl:  string;
  rankTier: number;
  rankName: string;
  rankIcon: string;
  rr:       number;
}

type AuthState =
  | { status: "loading"         }
  | { status: "unauthenticated" }
  | { status: "authenticated"; session: RsoSession }
  | { status: "error"; message: string };

interface AuthContextValue {
  auth:    AuthState;
  refresh: () => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/auth/riot/session", { cache: "no-store" });

      if (!res.ok) {
        setAuth({ status: "error", message: "Profil bilgileri yüklenemedi." });
        return;
      }

      const data = await res.json() as {
        authenticated: boolean;
        puuid?:    string | null;
        gameName?: string | null;
        tagLine?:  string | null;
        level?:    number;
        cardUrl?:  string;
        rankTier?: number;
        rankName?: string;
        rankIcon?: string;
        rr?:       number;
        reason?:   string;
      };

      if (data.authenticated) {
        setAuth({
          status: "authenticated",
          session: {
            authenticated: true,
            puuid:    data.puuid    ?? null,
            gameName: data.gameName ?? null,
            tagLine:  data.tagLine  ?? null,
            level:    data.level    ?? 0,
            cardUrl:  data.cardUrl  ?? "",
            rankTier: data.rankTier ?? 0,
            rankName: data.rankName ?? "Unranked",
            rankIcon: data.rankIcon ?? "",
            rr:       data.rr       ?? 0,
          },
        });
      } else {
        setAuth({ status: "unauthenticated" });
      }
    } catch {
      // Ağ hatası — sessizce unauthenticated'a düş, hata gösterme
      setAuth({ status: "unauthenticated" });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/riot/logout", { method: "POST" });
    } catch { /* devam */ }
    // Çıkışta tüm session'a bağlı localStorage verilerini temizle
    try {
      const keysToRemove = [
        "vt_search_history",  // arama geçmişi
        "vt_rso_profile",     // RSO profil cache
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      // vt_settings (tema/dil) kasıtlı korunuyor — kullanıcı tercihi
    } catch { /* devam */ }
    setAuth({ status: "unauthenticated" });
  }, []);

  // İlk yükleme
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AuthContext.Provider value={{ auth, refresh, logout }}>
      {children}
      {/* RSO callback sonrası otomatik refresh */}
      <CallbackRefresher onRefresh={refresh} />
    </AuthContext.Provider>
  );
}

// RSO callback'ten dönen ?rso_success=1 param'ını algılar ve session'ı refresh eder
// NOT: Hiçbir zaman auth.riotgames.com'a doğrudan fetch YAPMA — CORS hatası verir
// Tüm Riot iletişimi sunucu tarafında (/api/auth/riot/*) gerçekleşir
function CallbackRefresher({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const searchParams = useSearchParams();
  const router       = useRouter();

  useEffect(() => {
    const success = searchParams.get("rso_success");
    const error   = searchParams.get("rso_error");

    if (success === "1") {
      // Session'ı refresh et, sonra profil sayfasına yönlendir
      onRefresh().then(async () => {
        // Güncel session'ı oku
        try {
          const res  = await fetch("/api/auth/riot/session", { cache: "no-store" });
          const data = await res.json() as {
            authenticated: boolean;
            gameName?: string | null;
            tagLine?:  string | null;
          };

          if (data.authenticated && data.gameName && data.tagLine) {
            // Profil sayfasına yönlendir
            router.replace(
              `/player/${encodeURIComponent(data.gameName)}/${encodeURIComponent(data.tagLine)}`
            );
          } else {
            // Profil bilgisi yoksa URL'i temizle
            const url = new URL(window.location.href);
            url.searchParams.delete("rso_success");
            router.replace(url.pathname + (url.search || ""), { scroll: false });
          }
        } catch {
          const url = new URL(window.location.href);
          url.searchParams.delete("rso_success");
          router.replace(url.pathname + (url.search || ""), { scroll: false });
        }
      });
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        server_config:        "Sunucu yapılandırması eksik (RIOT_RSO_CLIENT_ID/SECRET).",
        state_mismatch:       "Güvenlik doğrulaması başarısız.",
        missing_params:       "Geçersiz callback parametresi.",
        token_exchange_failed:"Token alınamadı.",
        network_error:        "Ağ hatası.",
      };
      console.warn("[RSO] Giriş hatası:", errorMessages[error] ?? error);

      const url = new URL(window.location.href);
      url.searchParams.delete("rso_error");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
