"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, AlertCircle, Search } from "lucide-react";
import Link from "next/link";

export default function MyStatsPage() {
  const { auth, refresh } = useAuth();
  const router = useRouter();
  const [waited, setWaited] = useState(false);

  // 3 saniye bekle, hâlâ gameName yoksa hata göster
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "authenticated") {
      const { gameName, tagLine } = auth.session;
      if (gameName && tagLine) {
        router.replace(
          `/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
        );
      }
      // gameName yoksa waited state'i bekle — hata UI gösterilecek
    } else if (auth.status === "unauthenticated") {
      window.location.href = "/api/auth/riot/login";
    }
  }, [auth, router]);

  // Yükleniyor
  if (auth.status === "loading" || (auth.status === "authenticated" && auth.session.gameName && !waited)) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF4655] animate-spin" />
          <p className="text-white/40 text-sm">İstatistikler yükleniyor...</p>
        </div>
      </main>
    );
  }

  // Giriş yapılmış ama gameName yok
  if (auth.status === "authenticated" && !auth.session.gameName) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-white font-bold text-lg">Riot adın bulunamadı</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Hesabın bağlandı ama Riot adın alınamadı. Çıkış yapıp tekrar giriş yapmayı dene.
            Ya da arama çubuğuna kendi adını yazarak istatistiklerini görebilirsin.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 text-[#FF4655] text-sm font-semibold hover:bg-[#FF4655]/20 transition-colors"
            >
              <Search className="w-4 h-4" />
              Arama Sayfasına Git
            </Link>
            <button
              onClick={() => { refresh(); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Yönlendirme bekleniyor
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#FF4655] animate-spin" />
        <p className="text-white/40 text-sm">Yönlendiriliyor...</p>
      </div>
    </main>
  );
}
