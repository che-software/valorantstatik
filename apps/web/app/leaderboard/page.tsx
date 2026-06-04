"use client";
// Valorant resmi leaderboard — HenrikDev API üzerinden gerçek veriler
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Shield, ChevronLeft, ChevronRight, RefreshCw, Globe } from "lucide-react";
import { SkeletonMatch } from "@/components/SkeletonLoader";

interface LeaderboardPlayer {
  rank: number;
  puuid: string;
  name: string;
  tag: string;
  rr: number;
  wins: number;
  tier: number;
  tierName: string;
  rankIconUrl: string;
  cardSmall: string;
  isAnonymous: boolean;
  isBanned: boolean;
}

const REGIONS = [
  { id: "eu",    label: "EU",    flag: "🇪🇺" },
  { id: "na",    label: "NA",    flag: "🇺🇸" },
  { id: "ap",    label: "AP",    flag: "🌏" },
  { id: "kr",    label: "KR",    flag: "🇰🇷" },
  { id: "latam", label: "LATAM", flag: "🌎" },
  { id: "br",    label: "BR",    flag: "🇧🇷" },
];

const medalColor = (rank: number) =>
  rank === 1 ? "text-yellow-400" :
  rank === 2 ? "text-slate-300"  :
  rank === 3 ? "text-amber-600"  : "text-white/30";

const medalBg = (rank: number) =>
  rank === 1 ? "bg-yellow-400/10 border-yellow-400/20" :
  rank === 2 ? "bg-slate-300/10 border-slate-300/20"   :
  rank === 3 ? "bg-amber-600/10 border-amber-600/20"   : "";

export default function LeaderboardPage() {
  const [players,    setPlayers]    = useState<LeaderboardPlayer[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [region,     setRegion]     = useState("eu");
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const load = useCallback(async (r: string, p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leaderboard?region=${r}&page=${p}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yüklenemedi");
      setPlayers(data.players ?? []);
      setTotal(data.total ?? 0);
      setLastUpdate(data.lastUpdate ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Leaderboard yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(region, page); }, [region, page, load]);

  function handleRegion(r: string) {
    setRegion(r);
    setPage(1);
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Trophy className="w-5 h-5 text-[#FF4655]" />
        <h1 className="text-white font-black text-xl flex-1">Valorant Leaderboard</h1>
        <button
          onClick={() => load(region, page)}
          disabled={loading}
          className="text-white/30 hover:text-[#FF4655] transition-colors disabled:opacity-30"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Bölge seçici */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Globe className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        {REGIONS.map(r => (
          <button
            key={r.id}
            onClick={() => handleRegion(r.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              region === r.id
                ? "bg-[#FF4655] text-white shadow-lg shadow-[#FF4655]/20"
                : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/8"
            }`}
          >
            {r.flag} {r.label}
          </button>
        ))}
      </div>

      {/* Son güncelleme */}
      {lastUpdate && (
        <p className="text-white/20 text-xs mb-4">
          Son güncelleme: {new Date(lastUpdate).toLocaleString("tr-TR")}
        </p>
      )}

      {/* Hata */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-xl p-4 text-white/50 text-sm text-center border border-[#FF4655]/20 mb-6"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <SkeletonMatch key={i} />)}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Shield className="w-12 h-12 text-white/10 mx-auto" />
          <p className="text-white/30 text-sm">Veri bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {players.map((p, i) => (
            <motion.div
              key={`${p.puuid}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              {p.isAnonymous || p.isBanned ? (
                // Gizli / banlı oyuncu — tıklanamaz
                <div className={`glass-card rounded-xl px-4 py-3 flex items-center gap-4 border border-white/5 opacity-40 ${medalBg(p.rank)}`}>
                  <PlayerRow p={p} medalColor={medalColor} />
                </div>
              ) : (
                <Link href={`/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`}>
                  <div className={`glass-card rounded-xl px-4 py-3 flex items-center gap-4 hover:border-[#FF4655]/30 transition-all border border-white/5 cursor-pointer ${medalBg(p.rank)}`}>
                    <PlayerRow p={p} medalColor={medalColor} />
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Sayfalama */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/40 text-sm">
            Sayfa <span className="text-white font-bold">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
}

// Satır içeriği — hem link hem de gizli oyuncu için ortak
function PlayerRow({ p, medalColor }: { p: LeaderboardPlayer; medalColor: (r: number) => string }) {
  return (
    <>
      {/* Sıra numarası */}
      <span className={`text-sm font-black w-8 text-center flex-shrink-0 ${medalColor(p.rank)}`}>
        {p.rank <= 3 ? ["🥇","🥈","🥉"][p.rank - 1] : p.rank}
      </span>

      {/* Avatar */}
      <div className="relative w-9 h-9 flex-shrink-0">
        {p.cardSmall ? (
          <Image src={p.cardSmall} alt={p.name} fill className="rounded-lg object-cover" unoptimized />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <span className="text-sm font-bold text-white/30">
              {p.isAnonymous ? "?" : p.name[0]}
            </span>
          </div>
        )}
      </div>

      {/* İsim */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">
          {p.isAnonymous ? (
            <span className="text-white/30 italic">Gizli Oyuncu</span>
          ) : (
            <>{p.name}<span className="text-white/30">#{p.tag}</span></>
          )}
        </p>
        <p className="text-white/30 text-xs">{p.wins} galibiyet</p>
      </div>

      {/* RR */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="text-[#FF4655] font-black text-sm">{p.rr} RR</p>
      </div>

      {/* Rank ikonu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {p.rankIconUrl ? (
          <Image src={p.rankIconUrl} alt={p.tierName} width={32} height={32} style={{ height: "auto" }} unoptimized />
        ) : (
          <Shield className="w-8 h-8 text-white/20" />
        )}
        <p className="text-white/60 text-xs font-semibold hidden md:block">{p.tierName}</p>
      </div>
    </>
  );
}
