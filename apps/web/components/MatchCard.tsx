"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Star, ChevronDown, Crosshair, Zap, Shield, RefreshCw, Droplets } from "lucide-react";
import { TransformedMatch } from "@/lib/transformer";
import { getRankIcon, getRankInfo } from "@/lib/rank-map";
import { getMatchInsights, INSIGHT_COLORS } from "@/lib/performance-insights";

// Valorant harita arka plan görselleri (splash)
const MAP_BACKGROUNDS: Record<string, string> = {
  Ascent:    "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png",
  Bind:      "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png",
  Haven:     "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7825ad097a5e/splash.png",
  Split:     "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png",
  Fracture:  "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png",
  Breeze:    "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png",
  Icebox:    "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png",
  Pearl:     "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821f8ade99/splash.png",
  Lotus:     "https://media.valorant-api.com/maps/2fe4ed3a-450a-01bc-1236-0dbf487624c4/splash.png",
  Sunset:    "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39f9f532f9e3/splash.png",
  Abyss:     "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png",
};

function getMapBg(mapName: string): string | null {
  return MAP_BACKGROUNDS[mapName] ?? null;
}

// KAST hesaplama — kills + assists + survived + traded
function calcKast(match: TransformedMatch, playerPuuid: string): number {
  const rounds = match.rounds || 1;
  // Basit yaklaşım: kills+assists olan round sayısını tahmin et
  const player = match.players.find(p => p.puuid === playerPuuid);
  if (!player) return 0;
  const { kills, assists, deaths } = player.stats;
  // KAST = (K+A+survived) / rounds * 100 (survived = rounds - deaths yaklaşımı)
  const survived = Math.max(0, rounds - deaths);
  const kastRounds = Math.min(rounds, kills + assists + survived);
  return Math.round((kastRounds / rounds) * 100);
}

interface MatchCardProps {
  match: TransformedMatch;
  playerName: string;
  playerTag: string;
}

export default function MatchCard({ match, playerName, playerTag }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const player = match.players.find(
    p => p.name.toLowerCase() === playerName.toLowerCase() &&
         p.tag.toLowerCase()  === playerTag.toLowerCase()
  );
  if (!player) return null;

  const team = player.team as "red" | "blue";
  const won  = match.teams[team]?.won ?? false;
  const { kills, deaths, assists, headshots, bodyshots, legshots } = player.stats;
  const totalShots = headshots + bodyshots + legshots;
  const hsPercent  = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;
  const kd         = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  const myTeam     = match.teams[team];
  const oppTeam    = match.teams[team === "red" ? "blue" : "red"];
  const score      = `${myTeam?.roundsWon ?? 0}-${oppTeam?.roundsWon ?? 0}`;
  const date       = new Date(match.startedAt * 1000).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const rankIcon   = getRankIcon(player.tier);
  const rankInfo   = getRankInfo(player.tier);
  const mapBg      = getMapBg(match.map);

  // MVP = en yüksek ACS
  const maxAcs = Math.max(...match.players.map(p => p.acs));
  const isMvp  = player.acs === maxAcs && player.acs > 0;

  // Performans öngörüleri
  const insights = getMatchInsights({ kills, deaths, assists, headshots, bodyshots, legshots, acs: player.acs, adr: player.adr, won });

  // KAST
  const kast = calcKast(match, player.puuid);

  // First Blood tahmini (kills > 0 ve erken round'da)
  const hasFirstBlood = kills > 0 && player.acs > 150;

  // Takım skorları
  const allPlayers = match.players;
  const myTeamPlayers  = allPlayers.filter(p => p.team === team).sort((a, b) => b.acs - a.acs);
  const oppTeamPlayers = allPlayers.filter(p => p.team !== team).sort((a, b) => b.acs - a.acs);

  return (
    <div className={`relative rounded-xl overflow-hidden border transition-all duration-200
      ${won
        ? "border-green-500/20 hover:border-green-500/35"
        : "border-red-500/20 hover:border-red-500/35"
      }`}>

      {/* Harita blur arka plan */}
      {mapBg && (
        <div className="absolute inset-0 pointer-events-none">
          <Image src={mapBg} alt={match.map} fill className="object-cover opacity-[0.07] blur-sm scale-105" unoptimized />
          <div className={`absolute inset-0 ${won ? "bg-[#0f1923]/90" : "bg-[#0f1923]/92"}`} />
        </div>
      )}
      {!mapBg && (
        <div className={`absolute inset-0 pointer-events-none ${won ? "bg-green-500/[0.04]" : "bg-red-500/[0.04]"}`} />
      )}

      {/* Sol renk çizgisi */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${won ? "bg-green-500" : "bg-red-500"}`} />

      {/* Ana satır */}
      <div
        className="relative pl-4 pr-3 py-3 flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Ajan ikonu */}
        <div className="relative w-11 h-11 flex-shrink-0">
          <Image src={player.agentIcon} alt={player.character} fill
            className="rounded-lg object-cover" unoptimized />
          {isMvp && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-lg shadow-yellow-400/30">
              <Star className="w-2.5 h-2.5 text-black fill-black" />
            </div>
          )}
        </div>

        {/* Orta bilgi */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[11px] font-bold uppercase px-1.5 py-0.5 rounded ${won ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
              {won ? "Victory" : "Defeat"}
            </span>
            {isMvp && (
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                ★ MVP
              </span>
            )}
            {insights.map(ins => (
              <span key={ins.label}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${INSIGHT_COLORS[ins.color]}`}>
                {ins.emoji} {ins.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-white/35 text-xs">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{match.map}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{match.duration}dk</span>
            <span className="text-white/25">{match.mode}</span>
            <span className="text-white/20">{date}</span>
          </div>
        </div>

        {/* Rank (sm+) */}
        <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-0.5">
          <Image src={rankIcon} alt={rankInfo.name} width={26} height={26} unoptimized />
          <span className="text-white/25 text-[10px]">{rankInfo.name}</span>
        </div>

        {/* KDA + stats */}
        <div className="text-right flex-shrink-0">
          <p className="text-white font-bold text-sm">{kills}/{deaths}/{assists}</p>
          <p className="text-white/35 text-xs">K/D {kd} · HS {hsPercent}%</p>
          <p className="text-white/35 text-xs">ADR {player.adr} · ACS {player.acs}</p>
        </div>

        {/* Skor (md+) */}
        <div className="text-right flex-shrink-0 hidden md:block min-w-[52px]">
          <p className={`font-black text-xl leading-none ${won ? "text-green-400" : "text-red-400"}`}>{score}</p>
          <p className="text-white/20 text-[10px] mt-0.5">SCORE</p>
        </div>

        {/* Accordion ok */}
        <ChevronDown className={`w-4 h-4 text-white/25 flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </div>

      {/* Accordion detay paneli */}
      {expanded && (
        <div className="relative border-t border-white/[0.06] px-4 py-4 space-y-4">

          {/* Detay istatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Headshot % */}
            <div className="bg-white/[0.04] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Crosshair className="w-3.5 h-3.5 text-yellow-400" />
                <span>Headshot</span>
              </div>
              <p className="text-yellow-400 font-black text-2xl leading-none">{hsPercent}%</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${hsPercent}%` }} />
              </div>
              <p className="text-white/25 text-[10px]">{headshots} HS / {totalShots} atış</p>
            </div>

            {/* KAST */}
            <div className="bg-white/[0.04] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>KAST</span>
              </div>
              <p className="text-blue-400 font-black text-2xl leading-none">{kast}%</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${kast}%` }} />
              </div>
              <p className="text-white/25 text-[10px]">K·A·S·T ratio</p>
            </div>

            {/* ADR */}
            <div className="bg-white/[0.04] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Zap className="w-3.5 h-3.5 text-[#FF4655]" />
                <span>ADR</span>
              </div>
              <p className="text-[#FF4655] font-black text-2xl leading-none">{player.adr}</p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF4655] rounded-full transition-all" style={{ width: `${Math.min(player.adr / 2, 100)}%` }} />
              </div>
              <p className="text-white/25 text-[10px]">Damage per round</p>
            </div>

            {/* First Blood */}
            <div className="bg-white/[0.04] rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Droplets className="w-3.5 h-3.5 text-red-400" />
                <span>First Blood</span>
              </div>
              <p className={`font-black text-2xl leading-none ${hasFirstBlood ? "text-red-400" : "text-white/20"}`}>
                {hasFirstBlood ? "Yes" : "None"}
              </p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${hasFirstBlood ? "bg-red-400 w-full" : "w-0"}`} />
              </div>
              <p className="text-white/25 text-[10px]">First blood estimate</p>
            </div>
          </div>

          {/* Vücut bölgesi dağılımı */}
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Shot Distribution</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
                {totalShots > 0 && (
                  <>
                    <div className="h-full bg-yellow-400 transition-all" style={{ width: `${(headshots / totalShots) * 100}%` }} title={`HS ${hsPercent}%`} />
                    <div className="h-full bg-blue-400/70 transition-all" style={{ width: `${(bodyshots / totalShots) * 100}%` }} title="Body" />
                    <div className="h-full bg-white/20 transition-all" style={{ width: `${(legshots / totalShots) * 100}%` }} title="Leg" />
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/40 flex-shrink-0">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />HS {hsPercent}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400/70 inline-block" />Body {totalShots > 0 ? Math.round((bodyshots / totalShots) * 100) : 0}%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" />Leg {totalShots > 0 ? Math.round((legshots / totalShots) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Takım tablosu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: won ? "Winning Team" : "Your Team",  players: myTeamPlayers, accent: won ? "text-green-400" : "text-red-400" },
              { label: won ? "Losing Team"  : "Enemy Team", players: oppTeamPlayers, accent: "text-white/40" },
            ].map(side => (
              <div key={side.label} className="bg-white/[0.03] rounded-xl overflow-hidden">
                <p className={`text-[10px] uppercase tracking-wider px-3 py-2 border-b border-white/[0.05] ${side.accent} font-semibold`}>
                  {side.label}
                </p>
                <div className="divide-y divide-white/[0.04]">
                  {side.players.map(p => {
                    const isMe = p.name.toLowerCase() === playerName.toLowerCase() && p.tag.toLowerCase() === playerTag.toLowerCase();
                    const pKd  = p.stats.deaths > 0 ? (p.stats.kills / p.stats.deaths).toFixed(1) : p.stats.kills.toString();
                    const kdNum = parseFloat(pKd);
                    const kdColor = kdNum >= 1.5 ? "text-green-400" : kdNum >= 1.0 ? "text-white/60" : "text-red-400";
                    const profileHref = `/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`;
                    return (
                      <Link
                        key={p.puuid}
                        href={profileHref}
                        onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-2 px-3 py-2 transition-colors group
                          ${isMe ? "bg-white/[0.05]" : "hover:bg-[#FF4655]/[0.06] cursor-pointer"}`}
                      >
                        {/* Ajan ikonu */}
                        <div className="relative w-7 h-7 flex-shrink-0">
                          <Image src={p.agentIcon} alt={p.character} fill className="rounded object-cover" unoptimized />
                        </div>
                        {/* İsim + tag */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-semibold truncate transition-colors
                              ${isMe ? "text-white" : "text-white/60 group-hover:text-white"}`}>
                              {p.name}
                            </span>
                            <span className={`text-[10px] flex-shrink-0 transition-colors
                              ${isMe ? "text-white/40" : "text-white/25 group-hover:text-white/50"}`}>
                              #{p.tag}
                            </span>
                            {isMe && <span className="text-[#FF4655] text-[10px] flex-shrink-0">●</span>}
                          </div>
                          <p className="text-white/25 text-[10px]">{p.character}</p>
                        </div>
                        {/* KDA ayrı kolonlar */}
                        <div className="flex items-center gap-1 text-xs flex-shrink-0">
                          <span className="text-green-400 font-bold w-5 text-center">{p.stats.kills}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-red-400 font-bold w-5 text-center">{p.stats.deaths}</span>
                          <span className="text-white/20">/</span>
                          <span className="text-blue-400 font-bold w-5 text-center">{p.stats.assists}</span>
                        </div>
                        {/* K/D + ACS */}
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <p className={`text-[11px] font-bold ${kdColor}`}>{pKd}</p>
                          <p className="text-white/20 text-[10px]">{p.acs}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Maç detay linki */}
          <div className="flex justify-end">
            <Link
              href={`/match/${match.matchId}`}
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[#FF4655] text-xs hover:underline"
            >
              <RefreshCw className="w-3 h-3" /> Tam Maç Detayı
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
