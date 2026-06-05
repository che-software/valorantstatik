"use client";
/**
 * @file AgentMastery.tsx
 * @description Agent performance panel with per-map breakdown and a
 *              "Should I main this?" recommendation system.
 *
 * Main score (0–100) is a composite of win rate, KDA and ACS relative
 * to the player's own overall average — so it rewards consistency,
 * not just raw numbers.
 */

import Image from "next/image";
import { useState } from "react";
import { Crosshair, ChevronDown, MapPin, Star, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { AgentStat, getAgentRole } from "@/lib/stats-processor";

// ── Verdict styles ────────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  main: {
    label:  "Main This",
    icon:   <Star      className="w-3.5 h-3.5" />,
    color:  "text-emerald-400",
    bg:     "bg-emerald-400/10 border-emerald-400/25",
    bar:    "bg-emerald-400",
    trend:  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
  },
  secondary: {
    label:  "Good Secondary",
    icon:   <TrendingUp className="w-3.5 h-3.5" />,
    color:  "text-blue-400",
    bg:     "bg-blue-400/10 border-blue-400/25",
    bar:    "bg-blue-400",
    trend:  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />,
  },
  situational: {
    label:  "Situational",
    icon:   <AlertTriangle className="w-3.5 h-3.5" />,
    color:  "text-yellow-400",
    bg:     "bg-yellow-400/10 border-yellow-400/25",
    bar:    "bg-yellow-400",
    trend:  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  },
  avoid: {
    label:  "Consider Avoiding",
    icon:   <TrendingDown className="w-3.5 h-3.5" />,
    color:  "text-red-400",
    bg:     "bg-red-400/10 border-red-400/25",
    bar:    "bg-red-400",
    trend:  <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
  },
} as const;

// ── Role colour dots ──────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  Duelist:    "bg-rose-400",
  Controller: "bg-blue-400",
  Initiator:  "bg-amber-400",
  Sentinel:   "bg-emerald-400",
  Unknown:    "bg-white/20",
};

// ── Single agent card ─────────────────────────────────────────────────────────
function AgentCard({ agent, rank }: { agent: AgentStat; rank: number }) {
  const [open, setOpen] = useState(false);
  const vc   = VERDICT_CONFIG[agent.mainVerdict];
  const role = getAgentRole(agent.agent);

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
                     ${open ? "border-white/[0.12]" : "border-white/[0.06] hover:border-white/[0.10]"}`}>

      {/* ── Summary row ── */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        {/* Rank number */}
        <span className="text-white/20 text-xs w-4 flex-shrink-0 text-center">{rank}</span>

        {/* Agent icon */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image src={agent.agentIcon} alt={agent.agent} fill
                 className="rounded-xl object-cover" unoptimized />
          {rank === 1 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full
                            flex items-center justify-center shadow-lg shadow-yellow-400/30">
              <Star className="w-2.5 h-2.5 text-black fill-black" />
            </div>
          )}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-white font-bold text-sm">{agent.agent}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ROLE_COLORS[role] ?? ROLE_COLORS.Unknown}`} />
            <span className="text-white/30 text-[10px]">{role}</span>
          </div>
          {/* Main score bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden max-w-[80px]">
              <div className={`h-full rounded-full transition-all ${vc.bar}`}
                   style={{ width: `${agent.mainScore}%` }} />
            </div>
            <span className={`text-[10px] font-bold ${vc.color}`}>{agent.mainScore}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs flex-shrink-0">
          <div className="text-center">
            <p className={`font-bold ${agent.winRate >= 55 ? "text-emerald-400" : agent.winRate >= 45 ? "text-white" : "text-red-400"}`}>
              {agent.winRate}%
            </p>
            <p className="text-white/25 text-[10px]">WR</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{agent.kda}</p>
            <p className="text-white/25 text-[10px]">KDA</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{agent.avgAcs}</p>
            <p className="text-white/25 text-[10px]">ACS</p>
          </div>
          <div className="text-center">
            <p className="text-white/60">{agent.played}</p>
            <p className="text-white/25 text-[10px]">games</p>
          </div>
        </div>

        {/* Verdict badge */}
        <span className={`hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-full
                          text-[10px] font-bold border flex-shrink-0 ${vc.color} ${vc.bg}`}>
          {vc.icon} {vc.label}
        </span>

        <ChevronDown className={`w-4 h-4 text-white/25 flex-shrink-0 transition-transform duration-200
                                 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* ── Expanded detail panel ── */}
      {open && (
        <div className="border-t border-white/[0.05] px-4 py-4 space-y-4 bg-white/[0.02]">

          {/* Recommendation banner */}
          <div className={`flex items-start gap-3 p-3 rounded-xl border ${vc.bg}`}>
            <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${vc.color}`} />
            <div>
              <p className={`text-xs font-bold ${vc.color} mb-0.5`}>{vc.label}</p>
              <p className="text-white/55 text-xs leading-relaxed">{agent.mainReason}</p>
            </div>
          </div>

          {/* Mobile stats row */}
          <div className="sm:hidden grid grid-cols-4 gap-2">
            {[
              { label: "Win Rate", value: `${agent.winRate}%`, color: agent.winRate >= 50 ? "text-emerald-400" : "text-red-400" },
              { label: "KDA",      value: String(agent.kda),   color: "text-white" },
              { label: "ACS",      value: String(agent.avgAcs),color: "text-white" },
              { label: "Games",    value: String(agent.played), color: "text-white/60" },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.04] rounded-lg p-2 text-center">
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/25 text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Per-map performance */}
          {agent.mapBreakdown.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <MapPin className="w-3.5 h-3.5 text-white/30" />
                <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">
                  Performance by Map
                </p>
              </div>

              <div className="space-y-2">
                {agent.mapBreakdown.map((m) => {
                  const isBest  = m.map === agent.bestMap;
                  const isWorst = m.map === agent.worstMap;
                  return (
                    <div key={m.map} className="flex items-center gap-3">
                      {/* Map name */}
                      <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                        {isBest  && <span className="text-emerald-400 text-[10px]">▲</span>}
                        {isWorst && <span className="text-red-400    text-[10px]">▼</span>}
                        {!isBest && !isWorst && <span className="w-3" />}
                        <span className={`text-xs truncate ${isBest ? "text-emerald-400 font-semibold" : isWorst ? "text-red-400/70" : "text-white/50"}`}>
                          {m.map}
                        </span>
                      </div>

                      {/* Win rate bar */}
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${m.winRate >= 55 ? "bg-emerald-400" : m.winRate >= 40 ? "bg-blue-400" : "bg-red-400/70"}`}
                          style={{ width: `${m.winRate}%` }}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[11px] flex-shrink-0">
                        <span className={`font-bold w-8 text-right ${m.winRate >= 55 ? "text-emerald-400" : m.winRate >= 40 ? "text-white/70" : "text-red-400"}`}>
                          {m.winRate}%
                        </span>
                        <span className="text-white/30 w-10 text-right">ACS {m.avgAcs}</span>
                        <span className="text-white/20 w-8 text-right">{m.played}g</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Best / worst callout */}
              {agent.mapBreakdown.length >= 2 && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg px-3 py-2">
                    <p className="text-emerald-400/70 text-[10px] uppercase tracking-wider">Best Map</p>
                    <p className="text-emerald-400 text-sm font-bold">{agent.bestMap}</p>
                  </div>
                  {agent.worstMap && (
                    <div className="bg-red-500/[0.06] border border-red-500/15 rounded-lg px-3 py-2">
                      <p className="text-red-400/70 text-[10px] uppercase tracking-wider">Weakest Map</p>
                      <p className="text-red-400 text-sm font-bold">{agent.worstMap}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Time played */}
          <p className="text-white/20 text-[10px]">
            {agent.minutesPlayed} minutes played on {agent.agent}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AgentMastery({ agents }: { agents: AgentStat[] }) {
  if (!agents.length) return null;

  // Sort by mainScore descending for the recommendation view
  const sorted = [...agents].sort((a, b) => b.mainScore - a.mainScore).slice(0, 6);
  const topAgent = sorted[0];
  const vc = VERDICT_CONFIG[topAgent.mainVerdict];

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#FF4655]" />
          <h3 className="text-white font-bold text-sm uppercase tracking-widest">Agent Mastery</h3>
        </div>
        {/* Top recommendation chip */}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${vc.color} ${vc.bg}`}>
          {vc.trend}
          Main: {topAgent.agent}
        </span>
      </div>

      {/* Agent list */}
      <div className="p-3 space-y-1.5">
        {sorted.map((a, i) => (
          <AgentCard key={a.agent} agent={a} rank={i + 1} />
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-white/[0.05]">
        <p className="text-white/20 text-[10px] leading-relaxed">
          Main Score is based on your win rate, KDA and ACS compared to your own overall averages.
          Click any agent to see map-by-map performance.
        </p>
      </div>
    </div>
  );
}
