import Image from "next/image";
import { AgentStat } from "@/lib/stats-processor";
import { Crosshair } from "lucide-react";

export default function AgentMastery({ agents }: { agents: AgentStat[] }) {
  if (!agents.length) return null;
  const top = agents.slice(0, 5);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crosshair className="w-4 h-4 text-[#ff4654]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Ajan Ustalığı</h3>
      </div>
      <div className="space-y-3">
        {top.map((a) => (
          <div key={a.agent} className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image src={a.agentIcon} alt={a.agent} fill className="rounded-xl object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-semibold text-sm">{a.agent}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white/40">{a.played}G</span>
                  <span className="text-white/40">KDA <span className="text-white font-bold">{a.kda}</span></span>
                  <span className={`font-bold ${a.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>{a.winRate}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${a.winRate}%`, background: a.winRate >= 50 ? "#4ade80" : "#f87171" }} />
              </div>
              <div className="flex gap-3 text-[10px] text-white/30 mt-0.5">
                <span>ACS {a.avgAcs}</span>
                <span>{a.minutesPlayed}dk</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
