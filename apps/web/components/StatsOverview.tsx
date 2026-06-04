"use client";
import Image from "next/image";
import { TransformedMatch } from "@/lib/transformer";
import { TransformedPlayer } from "@/lib/transformer";
import { getRankIcon, getRankInfo } from "@/lib/rank-map";
import { TrendingUp, Crosshair, Swords, Target } from "lucide-react";

interface StatsOverviewProps {
  matches: TransformedMatch[];
  playerName: string;
  playerTag: string;
  player?: TransformedPlayer | null;
}

export default function StatsOverview({ matches, playerName, playerTag, player }: StatsOverviewProps) {
  let kills = 0, deaths = 0, assists = 0, wins = 0, hs = 0, shots = 0, totalAdr = 0;

  for (const m of matches) {
    const p = m.players.find(
      x => x.name.toLowerCase() === playerName.toLowerCase() && x.tag.toLowerCase() === playerTag.toLowerCase()
    );
    if (!p) continue;
    if (m.teams[p.team as "red" | "blue"]?.won) wins++;
    kills   += p.stats.kills;
    deaths  += p.stats.deaths;
    assists += p.stats.assists;
    hs      += p.stats.headshots;
    shots   += p.stats.headshots + p.stats.bodyshots + p.stats.legshots;
    totalAdr += p.adr;
  }

  const kd      = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
  const hsRate  = shots > 0 ? Math.round((hs / shots) * 100) : 0;
  const avgAdr  = matches.length > 0 ? Math.round(totalAdr / matches.length) : 0;

  const rank     = player?.rank;
  const peakRank = rank?.peak;

  // KD rengi
  const kdNum = parseFloat(kd);
  const kdColor = kdNum >= 1.5 ? "text-green-400" : kdNum >= 1.0 ? "text-white" : "text-red-400";

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Üst başlık şeridi */}
      <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">
          Son {matches.length} Maç Özeti
        </p>
        <div className="flex items-center gap-1.5 text-white/20 text-xs">
          <span>{wins}G</span>
          <span className="text-white/10">/</span>
          <span>{matches.length - wins}M</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Rank kartları */}
        {rank && (
          <div className="flex items-center gap-3">
            {/* Current Rank */}
            <div className="flex-1 bg-white/[0.04] rounded-xl p-3 flex items-center gap-3 border border-white/[0.05]">
              <Image
                src={rank.iconUrl}
                alt={rank.name}
                width={48}
                height={48}
                className="drop-shadow-lg flex-shrink-0"
                style={{ width: 48, height: "auto" }}
                unoptimized
              />
              <div className="min-w-0">
                <p className="text-white/30 text-[10px] uppercase tracking-wider">Güncel Rank</p>
                <p className="text-white font-bold text-sm leading-tight truncate">{rank.name}</p>
                <p className="text-white/40 text-xs">{rank.rr} RR
                  {rank.rrChange !== 0 && (
                    <span className={`ml-1.5 font-semibold ${rank.rrChange > 0 ? "text-green-400" : "text-red-400"}`}>
                      {rank.rrChange > 0 ? "+" : ""}{rank.rrChange}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Peak Rank */}
            {peakRank && peakRank.tier !== rank.tier && (
              <div className="flex-1 bg-white/[0.03] rounded-xl p-3 flex items-center gap-3 border border-white/[0.04] opacity-70">
                <Image
                  src={peakRank.iconUrl}
                  alt={peakRank.name}
                  width={40}
                  height={40}
                  className="flex-shrink-0"
                  style={{ width: 40, height: "auto" }}
                  unoptimized
                />
                <div className="min-w-0">
                  <p className="text-white/25 text-[10px] uppercase tracking-wider">Peak Rank</p>
                  <p className="text-white/60 font-semibold text-sm leading-tight truncate">{peakRank.name}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Win Rate progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" /> Kazanma Oranı
            </span>
            <span className={`font-bold ${winRate >= 55 ? "text-green-400" : winRate >= 45 ? "text-white" : "text-red-400"}`}>
              {winRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${winRate >= 55 ? "bg-green-500" : winRate >= 45 ? "bg-blue-500" : "bg-red-500"}`}
              style={{ width: `${winRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/20">
            <span>{wins} galibiyet</span>
            <span>{matches.length - wins} mağlubiyet</span>
          </div>
        </div>

        {/* İstatistik grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* K/D */}
          <div className="bg-white/[0.04] rounded-xl p-3 text-center space-y-1">
            <Swords className="w-4 h-4 text-[#FF4655] mx-auto" />
            <p className={`text-xl font-black leading-none ${kdColor}`}>{kd}</p>
            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF4655] rounded-full" style={{ width: `${Math.min(kdNum * 50, 100)}%` }} />
            </div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">K/D</p>
            <p className="text-white/20 text-[10px]">{kills}K {deaths}D {assists}A</p>
          </div>

          {/* Headshot % */}
          <div className="bg-white/[0.04] rounded-xl p-3 text-center space-y-1">
            <Crosshair className="w-4 h-4 text-yellow-400 mx-auto" />
            <p className="text-xl font-black leading-none text-yellow-400">{hsRate}%</p>
            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${hsRate}%` }} />
            </div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Headshot</p>
            <p className="text-white/20 text-[10px]">{hs} HS</p>
          </div>

          {/* ADR */}
          <div className="bg-white/[0.04] rounded-xl p-3 text-center space-y-1">
            <Target className="w-4 h-4 text-blue-400 mx-auto" />
            <p className="text-xl font-black leading-none text-blue-400">{avgAdr}</p>
            <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(avgAdr / 2, 100)}%` }} />
            </div>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">ADR</p>
            <p className="text-white/20 text-[10px]">Ort. hasar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
