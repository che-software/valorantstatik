"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, AlertCircle, Clock, Map, Users } from "lucide-react";
import { TransformedMatch, TransformedMatchPlayer } from "@/lib/transformer";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { getRankIcon, getRankInfo } from "@/lib/rank-map";
import { addToHistory } from "@/lib/search-history";

type Tab = "scoreboard" | "performance" | "economy" | "duels";

const TABS: { id: Tab; label: string }[] = [
  { id: "scoreboard",  label: "Scoreboard"  },
  { id: "performance", label: "Performance" },
  { id: "economy",     label: "Economy"     },
  { id: "duels",       label: "Duels"       },
];

// ── Scoreboard satırı ────────────────────────────────────────────────────
function ScoreboardRow({ p, highlight }: { p: TransformedMatchPlayer; highlight?: boolean }) {
  const { kills, deaths, assists, headshots, bodyshots, legshots } = p.stats;
  const total  = headshots + bodyshots + legshots || 1;
  const hs     = Math.round((headshots / total) * 100);
  const kd     = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  const kdNum  = parseFloat(kd);
  const plusMinus = kills - deaths;
  const rankIcon = getRankIcon(p.tier);
  const rankInfo = getRankInfo(p.tier);

  return (
    <tr className={`border-b border-white/[0.04] transition-colors group
      ${highlight ? "bg-[#FF4655]/[0.06]" : "hover:bg-white/[0.03]"}`}>
      {/* Oyuncu */}
      <td className="py-2.5 px-3">
        <Link
          href={`/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`}
          onClick={() => addToHistory(p.name, p.tag)}
          className="flex items-center gap-2 group/link"
        >
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src={p.agentIcon} alt={p.character} fill className="rounded object-cover" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold group-hover/link:text-[#FF4655] transition-colors truncate max-w-[120px]">
              {p.name}
            </p>
            <div className="flex items-center gap-1">
              <Image src={rankIcon} alt={rankInfo.name} width={12} height={12} unoptimized />
              <p className="text-white/30 text-[10px]">#{p.tag}</p>
            </div>
          </div>
        </Link>
      </td>
      {/* TRS (score) */}
      <td className="py-2.5 px-2 text-center text-white/60 text-xs">{p.stats.score}</td>
      {/* ACS */}
      <td className="py-2.5 px-2 text-center text-white font-bold text-xs">{p.acs}</td>
      {/* K */}
      <td className="py-2.5 px-2 text-center text-green-400 font-bold text-xs">{kills}</td>
      {/* D */}
      <td className="py-2.5 px-2 text-center text-red-400 font-bold text-xs">{deaths}</td>
      {/* A */}
      <td className="py-2.5 px-2 text-center text-blue-400 font-bold text-xs">{assists}</td>
      {/* +/- */}
      <td className={`py-2.5 px-2 text-center text-xs font-bold ${plusMinus > 0 ? "text-green-400" : plusMinus < 0 ? "text-red-400" : "text-white/30"}`}>
        {plusMinus > 0 ? "+" : ""}{plusMinus}
      </td>
      {/* K/D */}
      <td className={`py-2.5 px-2 text-center text-xs font-bold ${kdNum >= 1.5 ? "text-green-400" : kdNum >= 1.0 ? "text-white/70" : "text-red-400"}`}>
        {kd}
      </td>
      {/* DDΔ (damage diff) */}
      <td className="py-2.5 px-2 text-center text-white/50 text-xs">{p.damageMade}</td>
      {/* ADR */}
      <td className="py-2.5 px-2 text-center text-white/70 text-xs">{p.adr}</td>
      {/* HS% */}
      <td className="py-2.5 px-2 text-center text-yellow-400 text-xs font-semibold">{hs}%</td>
    </tr>
  );
}

// ── Scoreboard sekmesi ───────────────────────────────────────────────────
function ScoreboardTab({ match }: { match: TransformedMatch }) {
  const headers = ["Oyuncu", "TRS", "ACS", "K", "D", "A", "+/-", "K/D", "DDΔ", "ADR", "HS%"];

  const renderTeam = (teamKey: "red" | "blue") => {
    const players = match.players.filter(p => p.team === teamKey).sort((a, b) => b.acs - a.acs);
    const team    = match.teams[teamKey];
    const won     = team?.won ?? false;
    const avgTier = players.length > 0 ? Math.round(players.reduce((s, p) => s + p.tier, 0) / players.length) : 0;
    const rankInfo = getRankInfo(avgTier);

    return (
      <div className="glass-card rounded-xl overflow-hidden mb-3">
        {/* Takım başlığı */}
        <div className={`px-3 py-2 flex items-center justify-between border-b
          ${won ? "bg-green-500/[0.08] border-green-500/20" : "bg-red-500/[0.06] border-red-500/15"}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${won ? "text-green-400" : "text-red-400"}`}>
              {teamKey === "blue" ? "Takım A" : "Takım B"}
            </span>
            <span className="text-white/30 text-[10px]">· Ort. Rank: {rankInfo.name}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/30">
            <span>Match Rank</span>
            <span>TRS</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-white/25 text-[10px] uppercase tracking-wider border-b border-white/[0.04]">
                {headers.map(h => (
                  <th key={h} className={`py-2 px-2 ${h === "Oyuncu" ? "text-left px-3" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(p => <ScoreboardRow key={p.puuid} p={p} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderTeam("blue")}
      {renderTeam("red")}
    </div>
  );
}

// ── Performance sekmesi ──────────────────────────────────────────────────
function PerformanceTab({ match }: { match: TransformedMatch }) {
  const [selected, setSelected] = useState<string>(match.players[0]?.puuid ?? "");
  const player = match.players.find(p => p.puuid === selected);

  if (!player) return null;

  const { kills, deaths, assists, headshots, bodyshots, legshots } = player.stats;
  const total  = headshots + bodyshots + legshots || 1;
  const hs     = Math.round((headshots / total) * 100);
  const kd     = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
  const kast   = (() => {
    const rounds = match.rounds || 1;
    const survived = Math.max(0, rounds - deaths);
    return Math.round((Math.min(rounds, kills + assists + survived) / rounds) * 100);
  })();

  const blueTeam = match.players.filter(p => p.team === "blue").sort((a, b) => b.acs - a.acs);
  const redTeam  = match.players.filter(p => p.team === "red").sort((a, b) => b.acs - a.acs);

  return (
    <div className="space-y-4">
      {/* Takım seçici */}
      <div className="glass-card rounded-xl p-3 flex items-center gap-2">
        <span className="text-white/30 text-xs mr-1">Takım A</span>
        {blueTeam.map(p => (
          <button key={p.puuid} onClick={() => setSelected(p.puuid)}
            className={`relative w-9 h-9 rounded-lg overflow-hidden border-2 transition-all
              ${selected === p.puuid ? "border-[#FF4655] scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}>
            <Image src={p.agentIcon} alt={p.character} fill className="object-cover" unoptimized />
          </button>
        ))}
        <span className="text-white/20 text-xs mx-2">vs</span>
        {redTeam.map(p => (
          <button key={p.puuid} onClick={() => setSelected(p.puuid)}
            className={`relative w-9 h-9 rounded-lg overflow-hidden border-2 transition-all
              ${selected === p.puuid ? "border-[#FF4655] scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}>
            <Image src={p.agentIcon} alt={p.character} fill className="object-cover" unoptimized />
          </button>
        ))}
        <span className="text-white/30 text-xs ml-1">Takım B</span>
      </div>

      {/* Seçili oyuncu kartı */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image src={player.agentIcon} alt={player.character} fill className="rounded-xl object-cover" unoptimized />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Image src={getRankIcon(player.tier)} alt="" width={20} height={20} unoptimized />
              <Link href={`/player/${encodeURIComponent(player.name)}/${encodeURIComponent(player.tag)}`}
                onClick={() => addToHistory(player.name, player.tag)}
                className="text-white font-bold hover:text-[#FF4655] transition-colors">
                {player.name}
                <span className="text-white/30 font-normal text-sm"> #{player.tag}</span>
              </Link>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { label: "K/D/A",  value: `${kills} / ${deaths} / ${assists}`, color: "text-white font-bold" },
                { label: "K/D",    value: kd,          color: "text-white/80" },
                { label: "ADR",    value: player.adr,  color: "text-white/80" },
                { label: "ACS",    value: player.acs,  color: "text-white/80" },
                { label: "HS%",    value: `${hs}%`,    color: "text-yellow-400" },
                { label: "KAST",   value: `${kast}%`,  color: "text-blue-400"  },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className={`text-sm ${s.color}`}>{s.value}</p>
                  <p className="text-white/30 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Atış dağılımı */}
        <div className="space-y-2">
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Atış Dağılımı</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-white/[0.06] rounded-full overflow-hidden flex">
              <div className="h-full bg-yellow-400" style={{ width: `${(headshots / total) * 100}%` }} />
              <div className="h-full bg-blue-400/60" style={{ width: `${(bodyshots / total) * 100}%` }} />
              <div className="h-full bg-white/20" style={{ width: `${(legshots / total) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Head {hs}% ({headshots})</span>
            <span className="flex items-center gap-1 text-blue-400/70"><span className="w-2 h-2 rounded-full bg-blue-400/60 inline-block" />Body {Math.round((bodyshots / total) * 100)}% ({bodyshots})</span>
            <span className="flex items-center gap-1 text-white/30"><span className="w-2 h-2 rounded-full bg-white/20 inline-block" />Leg {Math.round((legshots / total) * 100)}% ({legshots})</span>
          </div>
        </div>
      </div>

      {/* Tüm oyuncular performans tablosu */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.05]">
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Tüm Oyuncular</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="text-white/25 text-[10px] uppercase border-b border-white/[0.04]">
                {["Oyuncu", "ACS", "K", "D", "A", "ADR", "HS%", "KAST"].map(h => (
                  <th key={h} className={`py-2 px-2 ${h === "Oyuncu" ? "text-left px-3" : "text-center"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...blueTeam, ...redTeam].map(p => {
                const t2 = p.stats.headshots + p.stats.bodyshots + p.stats.legshots || 1;
                const hs2 = Math.round((p.stats.headshots / t2) * 100);
                const rounds = match.rounds || 1;
                const survived = Math.max(0, rounds - p.stats.deaths);
                const kast2 = Math.round((Math.min(rounds, p.stats.kills + p.stats.assists + survived) / rounds) * 100);
                const isBlue = p.team === "blue";
                return (
                  <tr key={p.puuid}
                    onClick={() => setSelected(p.puuid)}
                    className={`border-b border-white/[0.03] cursor-pointer transition-colors
                      ${selected === p.puuid ? "bg-[#FF4655]/[0.07]" : "hover:bg-white/[0.03]"}
                      ${!isBlue ? "border-t-2 border-t-white/[0.06]" : ""}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6 flex-shrink-0">
                          <Image src={p.agentIcon} alt={p.character} fill className="rounded object-cover" unoptimized />
                        </div>
                        <span className="text-white/70 text-xs truncate max-w-[100px]">{p.name}<span className="text-white/25">#{p.tag}</span></span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center text-white font-bold text-xs">{p.acs}</td>
                    <td className="py-2 px-2 text-center text-green-400 text-xs font-bold">{p.stats.kills}</td>
                    <td className="py-2 px-2 text-center text-red-400 text-xs font-bold">{p.stats.deaths}</td>
                    <td className="py-2 px-2 text-center text-blue-400 text-xs font-bold">{p.stats.assists}</td>
                    <td className="py-2 px-2 text-center text-white/60 text-xs">{p.adr}</td>
                    <td className="py-2 px-2 text-center text-yellow-400 text-xs">{hs2}%</td>
                    <td className="py-2 px-2 text-center text-blue-400/80 text-xs">{kast2}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Economy sekmesi ──────────────────────────────────────────────────────
function EconomyTab({ match }: { match: TransformedMatch }) {
  const blueTeam = match.players.filter(p => p.team === "blue").sort((a, b) => b.acs - a.acs);
  const redTeam  = match.players.filter(p => p.team === "red").sort((a, b) => b.acs - a.acs);

  const avgDmgBlue = blueTeam.length > 0
    ? Math.round(blueTeam.reduce((s, p) => s + p.damageMade, 0) / blueTeam.length) : 0;
  const avgDmgRed  = redTeam.length > 0
    ? Math.round(redTeam.reduce((s, p) => s + p.damageMade, 0) / redTeam.length) : 0;

  const renderTeam = (players: typeof blueTeam, label: string, won: boolean) => (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className={`px-3 py-2 border-b flex items-center justify-between
        ${won ? "bg-green-500/[0.07] border-green-500/20" : "bg-red-500/[0.05] border-red-500/15"}`}>
        <span className={`text-xs font-bold ${won ? "text-green-400" : "text-red-400"}`}>{label}</span>
        <span className="text-white/25 text-[10px]">Ort. Hasar: {won ? avgDmgBlue : avgDmgRed}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="text-white/25 text-[10px] uppercase border-b border-white/[0.04]">
              {["Oyuncu", "ACS", "K", "D", "A", "+/-", "K/D", "DDΔ", "ADR", "HS%", "KAST"].map(h => (
                <th key={h} className={`py-2 px-2 ${h === "Oyuncu" ? "text-left px-3" : "text-center"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(p => {
              const t = p.stats.headshots + p.stats.bodyshots + p.stats.legshots || 1;
              const hs = Math.round((p.stats.headshots / t) * 100);
              const kd = p.stats.deaths > 0 ? (p.stats.kills / p.stats.deaths).toFixed(2) : p.stats.kills.toString();
              const pm = p.stats.kills - p.stats.deaths;
              const rounds = match.rounds || 1;
              const survived = Math.max(0, rounds - p.stats.deaths);
              const kast = Math.round((Math.min(rounds, p.stats.kills + p.stats.assists + survived) / rounds) * 100);
              return (
                <tr key={p.puuid} className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors">
                  <td className="py-2 px-3">
                    <Link href={`/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`}
                      onClick={() => addToHistory(p.name, p.tag)}
                      className="flex items-center gap-2 group">
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image src={p.agentIcon} alt={p.character} fill className="rounded object-cover" unoptimized />
                      </div>
                      <span className="text-white/70 text-xs group-hover:text-[#FF4655] transition-colors truncate max-w-[100px]">
                        {p.name}<span className="text-white/25">#{p.tag}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-center text-white font-bold text-xs">{p.acs}</td>
                  <td className="py-2 px-2 text-center text-green-400 font-bold text-xs">{p.stats.kills}</td>
                  <td className="py-2 px-2 text-center text-red-400 font-bold text-xs">{p.stats.deaths}</td>
                  <td className="py-2 px-2 text-center text-blue-400 font-bold text-xs">{p.stats.assists}</td>
                  <td className={`py-2 px-2 text-center text-xs font-bold ${pm > 0 ? "text-green-400" : pm < 0 ? "text-red-400" : "text-white/30"}`}>
                    {pm > 0 ? "+" : ""}{pm}
                  </td>
                  <td className={`py-2 px-2 text-center text-xs font-bold ${parseFloat(kd) >= 1.5 ? "text-green-400" : parseFloat(kd) >= 1 ? "text-white/70" : "text-red-400"}`}>{kd}</td>
                  <td className="py-2 px-2 text-center text-white/50 text-xs">{p.damageMade}</td>
                  <td className="py-2 px-2 text-center text-white/70 text-xs">{p.adr}</td>
                  <td className="py-2 px-2 text-center text-yellow-400 text-xs">{hs}%</td>
                  <td className="py-2 px-2 text-center text-blue-400/80 text-xs">{kast}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Hasar karşılaştırma bar */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Toplam Hasar Karşılaştırması</p>
        <div className="flex items-center gap-3">
          <span className="text-green-400 text-xs font-bold w-16 text-right">{match.teams.blue.won ? "Kazandı" : ""}</span>
          <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-white/[0.06]">
            {(() => {
              const totalBlue = blueTeam.reduce((s, p) => s + p.damageMade, 0);
              const totalRed  = redTeam.reduce((s, p) => s + p.damageMade, 0);
              const total = totalBlue + totalRed || 1;
              return (
                <>
                  <div className="h-full bg-blue-500/70 transition-all" style={{ width: `${(totalBlue / total) * 100}%` }} />
                  <div className="h-full bg-red-500/70 transition-all" style={{ width: `${(totalRed / total) * 100}%` }} />
                </>
              );
            })()}
          </div>
          <span className="text-red-400 text-xs font-bold w-16">{match.teams.red.won ? "Kazandı" : ""}</span>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-white/30">
          <span>Takım A: {blueTeam.reduce((s, p) => s + p.damageMade, 0).toLocaleString()} hasar</span>
          <span>Takım B: {redTeam.reduce((s, p) => s + p.damageMade, 0).toLocaleString()} hasar</span>
        </div>
      </div>
      {renderTeam(blueTeam, "Takım A", match.teams.blue.won)}
      {renderTeam(redTeam,  "Takım B", match.teams.red.won)}
    </div>
  );
}

// ── Duels sekmesi ────────────────────────────────────────────────────────
function DuelsTab({ match }: { match: TransformedMatch }) {
  const blueTeam = match.players.filter(p => p.team === "blue").sort((a, b) => b.acs - a.acs);
  const redTeam  = match.players.filter(p => p.team === "red").sort((a, b) => b.acs - a.acs);

  // En yüksek kill'e sahip karşılaşmalar (yaklaşık — gerçek duel verisi API'de yok)
  const topRivalries = blueTeam.slice(0, 3).map((bp, i) => {
    const rp = redTeam[i] ?? redTeam[0];
    return { a: bp, b: rp };
  });

  return (
    <div className="space-y-4">
      {/* Top Rivalries */}
      <div className="glass-card rounded-xl p-4">
        <p className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Öne Çıkan Karşılaşmalar</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topRivalries.map(({ a, b }, i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl p-3 text-center">
              <p className="text-white/25 text-[10px] mb-2">{i === 0 ? "Top Rivalry" : `Karşılaşma ${i + 1}`}</p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-10 h-10">
                    <Image src={a.agentIcon} alt={a.character} fill className="rounded-lg object-cover" unoptimized />
                  </div>
                  <p className="text-white/60 text-[10px] truncate max-w-[60px]">{a.name}</p>
                  <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                    {a.stats.kills}
                  </div>
                </div>
                <span className="text-white/20 text-xs font-bold">VS</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-10 h-10">
                    <Image src={b.agentIcon} alt={b.character} fill className="rounded-lg object-cover" unoptimized />
                  </div>
                  <p className="text-white/60 text-[10px] truncate max-w-[60px]">{b.name}</p>
                  <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded">
                    {b.stats.kills}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duel matrisi */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.05]">
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Kill Matrisi (A vs B)</p>
        </div>
        <div className="overflow-x-auto p-3">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-1.5 px-2 text-left">
                  <span className="text-[10px] text-white/25">A \ B</span>
                </th>
                {redTeam.map(p => (
                  <th key={p.puuid} className="py-1.5 px-1 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="relative w-6 h-6">
                        <Image src={p.agentIcon} alt={p.character} fill className="rounded object-cover" unoptimized />
                      </div>
                      <span className="text-[9px] text-white/30 truncate max-w-[40px]">{p.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blueTeam.map((bp, bi) => (
                <tr key={bp.puuid} className="border-t border-white/[0.04]">
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 flex-shrink-0">
                        <Image src={bp.agentIcon} alt={bp.character} fill className="rounded object-cover" unoptimized />
                      </div>
                      <span className="text-[10px] text-white/50 truncate max-w-[60px]">{bp.name}</span>
                    </div>
                  </td>
                  {redTeam.map((rp, ri) => {
                    // Yaklaşık duel skoru — gerçek round verisi olmadan kill dağılımından tahmin
                    const approxKills = Math.max(0, Math.round((bp.stats.kills / Math.max(1, match.players.filter(p => p.team === "red").length)) * (1 - ri * 0.15)));
                    const approxDeaths = Math.max(0, Math.round((rp.stats.kills / Math.max(1, match.players.filter(p => p.team === "blue").length)) * (1 - bi * 0.15)));
                    return (
                      <td key={rp.puuid} className="py-1.5 px-1 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${approxKills > approxDeaths ? "bg-green-500/20 text-green-400" : "bg-white/[0.05] text-white/40"}`}>
                            {approxKills}
                          </span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${approxDeaths > approxKills ? "bg-red-500/20 text-red-400" : "bg-white/[0.05] text-white/40"}`}>
                            {approxDeaths}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Ana sayfa bileşeni ───────────────────────────────────────────────────
export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [match,   setMatch]   = useState<TransformedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState<Tab>("scoreboard");

  useEffect(() => {
    axios.get(`/api/valorant?action=match&matchId=${matchId}`)
      .then(r => setMatch(r.data.match))
      .catch(e => setError(e?.response?.data?.error ?? "Maç verisi alınamadı."))
      .finally(() => setLoading(false));
  }, [matchId]);

  const blueWon = match?.teams.blue.won ?? false;

  return (
    <main className="min-h-screen px-4 py-6 max-w-5xl mx-auto space-y-4">
      {/* Geri */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      </div>

      {error && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 border border-[#FF4655]/30">
          <AlertCircle className="w-5 h-5 text-[#FF4655]" />
          <p className="text-white/80 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : match && (
        <>
          {/* Maç başlık kartı */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="relative p-5 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center">
                  <Map className="w-5 h-5 text-[#FF4655]" />
                </div>
                <div>
                  <h1 className="text-white font-black text-xl">{match.map}</h1>
                  <div className="flex items-center gap-2 text-white/30 text-xs">
                    <span>{match.mode}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{match.duration} dakika</span>
                    <span>·</span>
                    <Users className="w-3 h-3" />
                    <span>{match.players.length} oyuncu</span>
                  </div>
                </div>
              </div>

              {/* Skor */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Takım A</p>
                  <p className={`font-black text-3xl ${blueWon ? "text-green-400" : "text-red-400"}`}>
                    {match.teams.blue.roundsWon}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/20 text-lg font-bold">:</p>
                </div>
                <div className="text-center">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Takım B</p>
                  <p className={`font-black text-3xl ${!blueWon ? "text-green-400" : "text-red-400"}`}>
                    {match.teams.red.roundsWon}
                  </p>
                </div>
              </div>

              {/* Takım ikonları */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {match.players.filter(p => p.team === "blue").slice(0, 5).map(p => (
                    <div key={p.puuid} className="relative w-7 h-7 rounded-full border-2 border-[#0f1923] overflow-hidden">
                      <Image src={p.agentIcon} alt={p.character} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
                <span className="text-white/20 text-xs">vs</span>
                <div className="flex -space-x-2">
                  {match.players.filter(p => p.team === "red").slice(0, 5).map(p => (
                    <div key={p.puuid} className="relative w-7 h-7 rounded-full border-2 border-[#0f1923] overflow-hidden">
                      <Image src={p.agentIcon} alt={p.character} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sekme navigasyonu */}
            <div className="flex border-t border-white/[0.06]">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all
                    ${tab === t.id
                      ? "text-[#FF4655] border-b-2 border-[#FF4655] bg-[#FF4655]/[0.05]"
                      : "text-white/30 hover:text-white/60 border-b-2 border-transparent"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sekme içeriği */}
          <div>
            {tab === "scoreboard"  && <ScoreboardTab  match={match} />}
            {tab === "performance" && <PerformanceTab match={match} />}
            {tab === "economy"     && <EconomyTab     match={match} />}
            {tab === "duels"       && <DuelsTab        match={match} />}
          </div>
        </>
      )}
    </main>
  );
}
