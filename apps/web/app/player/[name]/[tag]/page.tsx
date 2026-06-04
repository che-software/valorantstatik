"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, AlertCircle, Clock, Shield, Trophy, FlaskConical } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import StatCard from "@/components/StatCard";
import StatsOverview from "@/components/StatsOverview";
import KdaTrendChart from "@/components/KdaTrendChart";
import WeaponTable from "@/components/WeaponTable";
import MapStats from "@/components/MapStats";
import AgentMastery from "@/components/AgentMastery";
import { SkeletonCard, SkeletonMatch, SkeletonStatsOverview } from "@/components/SkeletonLoader";
import { TransformedPlayer, TransformedMatch } from "@/lib/transformer";
import { processStats, LifetimeStats } from "@/lib/stats-processor";
import { getRankIcon } from "@/lib/rank-map";
import { MOCK_PLAYER, MOCK_MATCHES } from "@/lib/mock-data";
import { addToHistory } from "@/lib/search-history";
import TiltMeter from "@/components/TiltMeter";
import DuoSynergy from "@/components/DuoSynergy";
import ClutchPanel from "@/components/ClutchStats";
import { calcTiltStats, calcDuoSynergy, calcClutchStats } from "@/lib/advanced-stats";

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function PlayerHeader({ player }: { player: TransformedPlayer }) {
  const { rank } = player;
  const updatedAt = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {player.card?.wide ? (
        <div className="absolute inset-0">
          <Image src={player.card.wide} alt="" fill className="object-cover opacity-20" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1923] via-transparent to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF4655]/10 to-transparent" />
      )}
      <div className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative flex-shrink-0">
          {player.card?.small ? (
            <Image src={player.card.small} alt={player.name} width={80} height={80}
              className="rounded-2xl border border-white/10 object-cover" unoptimized />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-3xl font-black text-white/30">{player.name[0]}</span>
            </div>
          )}
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#FF4655] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            Lv {player.level}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {player.name}<span className="text-white/30 font-normal text-xl">#{player.tag}</span>
          </h1>
          <p className="text-white/40 text-sm uppercase tracking-widest mt-0.5">{player.region} Sunucusu</p>
          <p className="flex items-center gap-1 text-white/20 text-xs mt-2">
            <Clock className="w-3 h-3" /> {updatedAt} guncellendi
          </p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          {rank ? (
            <>
              <div className="text-center">
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Guncel Rank</p>
                <Image src={rank.iconUrl} alt={rank.name} width={56} height={56} style={{ width: 56, height: "auto" }} className="mx-auto drop-shadow-lg" unoptimized />
                <p className="text-white font-bold text-sm mt-1">{rank.name}</p>
                <p className="text-white/40 text-xs">{rank.rr} RR</p>
              </div>
              {rank.peak && rank.peak.tier !== rank.tier && (
                <div className="text-center opacity-60">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Peak</p>
                  <Image src={getRankIcon(rank.peak.tier)} alt={rank.peak.name} width={40} height={40} style={{ width: 40, height: "auto" }} className="mx-auto" unoptimized />
                  <p className="text-white/60 text-xs mt-1">{rank.peak.name}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <Shield className="w-12 h-12 text-white/10 mx-auto" />
              <p className="text-white/25 text-xs mt-1">Unranked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  const { name, tag } = useParams<{ name: string; tag: string }>();
  const playerName = decodeURIComponent(name);
  const playerTag  = decodeURIComponent(tag);

  const [player,  setPlayer]  = useState<TransformedPlayer | null>(null);
  const [matches, setMatches] = useState<TransformedMatch[]>([]);
  const [stats,   setStats]   = useState<LifetimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [isMock,  setIsMock]  = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    setIsMock(false);
    try {
      const p = new URLSearchParams({ name: playerName, tag: playerTag });
      const res = await axios.get(`/api/valorant?action=profile&${p}`);
      const fetchedPlayer  = res.data.player  as TransformedPlayer;
      const fetchedMatches = (res.data.matches ?? []) as TransformedMatch[];
      setPlayer(fetchedPlayer);
      setMatches(fetchedMatches);
      setStats(processStats(fetchedMatches, playerName, playerTag));
      if (res.data.warning) setError(res.data.warning);
    } catch (err) {
      // Axios hatasını görünür yap (401/403/429 vb. nedenler)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = anyErr?.response?.status as number | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiError = anyErr?.response?.data?.error as string | undefined;

      console.error("[PlayerPage] profile fetch failed:", {
        name: playerName,
        tag: playerTag,
        status,
        apiError,
        raw: anyErr?.response?.data,
      });

      const msg = apiError
        ? apiError
        : status
          ? `API hatası (${status}).`
          : "Canlı veri alınamadı.";
      setError(msg);

      const mockPlayer  = { ...MOCK_PLAYER, name: playerName, tag: playerTag };
      const mockMatches = MOCK_MATCHES.map(m => ({
        ...m,
        players: m.players.map(p => ({ ...p, name: playerName, tag: playerTag })),
      }));
      setPlayer(mockPlayer);
      setMatches(mockMatches);
      setStats(processStats(mockMatches, playerName, playerTag));
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [playerName, playerTag]); // eslint-disable-line

  // Profil açıldığında arama geçmişine ekle
  useEffect(() => {
    addToHistory(playerName, playerTag);
  }, [playerName, playerTag]);

  return (
    <main className="min-h-screen px-4 py-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#FF4655] text-xs transition-colors">
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </Link>
          {!loading && (
            <button onClick={load} className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#FF4655] text-xs transition-colors">
              <RefreshCw className="w-3 h-3" /> Yenile
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isMock && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-xl p-4 flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/5">
            <FlaskConical className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <p className="text-white/60 text-sm flex-1">
              Demo modu: canlı veri alınamadı; yerel örnek veriler gösteriliyor. Ağ veya API yapılandırmasını kontrol edin.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && !isMock && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card rounded-xl p-4 flex items-center gap-3 border border-[#FF4655]/30">
            <AlertCircle className="w-4 h-4 text-[#FF4655] flex-shrink-0" />
            <p className="text-white/70 text-sm flex-1">{error}</p>
            <button onClick={load} className="text-[#FF4655] text-xs hover:underline">Tekrar Dene</button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonStatsOverview />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          <div className="space-y-2">{[1,2,3,4,5].map(i => <SkeletonMatch key={i} />)}</div>
        </div>
      ) : player && stats ? (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" transition={{ duration: 0.4, ease: "easeOut" }} className="space-y-5">
          <PlayerHeader player={player} />

          {/* Dashboard özet kartı — Peak/Current Rank + Win Rate + KD */}
          <StatsOverview matches={matches} playerName={playerName} playerTag={playerTag} player={player} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="K/D Orani"  value={stats.kd}              sub={`${stats.kills}K / ${stats.deaths}D`}             color="#FF4655" delay={0.05} />
            <StatCard label="Kazanma %"  value={`${stats.winRate}%`}   sub={`${stats.wins}W / ${stats.matches - stats.wins}L`} color="#4ade80" delay={0.1}  />
            <StatCard label="Headshot %" value={`${stats.hsPercent}%`} sub={`${stats.headshots} HS`}                           color="#facc15" delay={0.15} />
            <StatCard label="ADR"        value={stats.adr}              sub={`Avg ACS ${stats.avgAcs}`}                        color="#60a5fa" delay={0.2}  />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <WeaponTable weapons={stats.weapons} />
            <MapStats    maps={stats.maps} />
            <AgentMastery agents={stats.agents} />
          </div>

          {/* Gelismis analitik satiri */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <TiltMeter tilt={calcTiltStats(matches, playerName, playerTag)} />
            <ClutchPanel clutch={calcClutchStats([], "", matches[0]?.map ?? "")} />
            <DuoSynergy partners={calcDuoSynergy(matches, playerName, playerTag)} />
          </div>
          <div className="space-y-2">
            <h3 className="text-white/40 text-xs uppercase tracking-widest font-semibold">
              Son {matches.length} Mac {isMock && <span className="text-yellow-400/60">(Demo)</span>}
            </h3>
            {matches.length >= 2 && (
              <KdaTrendChart key="kda-trend" matches={matches} playerName={playerName} playerTag={playerTag} />
            )}
            {matches.length === 0 ? (
              <p className="text-white/25 text-sm text-center py-10">Mac bulunamadi.</p>
            ) : (
              <div className="space-y-2">
                {matches.map((m, i) => (
                  <motion.div key={m.matchId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                    <MatchCard match={m} playerName={playerName} playerTag={playerTag} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </main>
  );
}