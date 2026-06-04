// Clutch Performansı — 1vX senaryoları görselleştirme
import { ClutchStats } from "@/lib/advanced-stats";
import { Swords } from "lucide-react";

export default function ClutchPanel({ clutch }: { clutch: ClutchStats }) {
  if (clutch.totalClutches === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-[#FF4655]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Clutch Performansı</h3>
        <span className="ml-auto text-white/30 text-xs">{clutch.totalWins}/{clutch.totalClutches} kazanıldı</span>
      </div>

      {/* Senaryo grid */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {clutch.scenarios.map(s => (
          <div key={s.type}
            className={`rounded-xl p-2 text-center border transition-all ${
              s.total > 0
                ? s.winRate >= 50
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
                : "bg-white/3 border-white/5 opacity-40"
            }`}>
            <p className="text-white font-black text-xs">{s.type}</p>
            {s.total > 0 ? (
              <>
                <p className={`text-sm font-black mt-0.5 ${s.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                  %{s.winRate}
                </p>
                <p className="text-white/30 text-[10px]">{s.wins}/{s.total}</p>
              </>
            ) : (
              <p className="text-white/20 text-[10px] mt-1">—</p>
            )}
          </div>
        ))}
      </div>

      {/* Genel oran */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-[#FF4655] rounded-full"
            style={{ width: `${clutch.overallRate}%` }} />
        </div>
        <span className="text-white/50 text-xs">%{clutch.overallRate} genel</span>
      </div>

      {/* Harita bazlı */}
      {Object.keys(clutch.byMap).length > 0 && (
        <div className="space-y-1.5 mt-3">
          <p className="text-white/30 text-[10px] uppercase tracking-wider">Harita Bazlı</p>
          {Object.entries(clutch.byMap)
            .sort((a, b) => b[1].winRate - a[1].winRate)
            .slice(0, 3)
            .map(([map, data]) => (
              <div key={map} className="flex items-center gap-2">
                <span className="text-white/50 text-xs w-20 truncate">{map}</span>
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${data.winRate >= 50 ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${data.winRate}%` }} />
                </div>
                <span className={`text-xs font-bold w-10 text-right ${data.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                  %{data.winRate}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
