import { MapStat } from "@/lib/stats-processor";
import { MapPin } from "lucide-react";

export default function MapStats({ maps }: { maps: MapStat[] }) {
  if (!maps.length) return null;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-4 h-4 text-[#ff4654]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Harita Analizi</h3>
      </div>
      <div className="space-y-3">
        {maps.map((m) => (
          <div key={m.map} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-sm font-semibold">{m.map}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-white/40">{m.played}G</span>
                  <span className="text-white/40">ACS <span className="text-white font-bold">{m.avgAcs}</span></span>
                  <span className={`font-bold ${m.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>{m.winRate}%</span>
                </div>
              </div>
              {/* W/L bar */}
              <div className="h-1.5 bg-white/8 rounded-full overflow-hidden flex">
                <div className="bg-green-500 h-full rounded-l-full transition-all"
                  style={{ width: `${m.winRate}%` }} />
                <div className="bg-red-500/60 h-full rounded-r-full flex-1" />
              </div>
              <div className="flex justify-between text-[10px] text-white/25 mt-0.5">
                <span>{m.wins}W</span><span>{m.losses}L</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
