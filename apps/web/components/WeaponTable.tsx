import { WeaponStat } from "@/lib/stats-processor";
import { Target } from "lucide-react";

export default function WeaponTable({ weapons }: { weapons: WeaponStat[] }) {
  if (!weapons.length) return null;
  const maxKills = weapons[0].kills;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-[#ff4654]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Silah İstatistikleri</h3>
      </div>
      <div className="space-y-3">
        {weapons.map((w) => (
          <div key={w.weapon} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-semibold">{w.weapon}</span>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span><span className="text-white font-bold">{w.kills}</span> kill</span>
                <span><span className="text-yellow-400 font-bold">{w.hsPercent}%</span> HS</span>
              </div>
            </div>
            {/* Kill bar */}
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#ff4654] rounded-full transition-all"
                style={{ width: `${(w.kills / maxKills) * 100}%` }} />
            </div>
            {/* Shot breakdown */}
            <div className="flex gap-1 h-1 rounded-full overflow-hidden">
              <div className="bg-yellow-400 rounded-full" style={{ width: `${w.hsPercent}%` }} title={`HS ${w.hsPercent}%`} />
              <div className="bg-blue-400 rounded-full flex-1" title="Body" />
              <div className="bg-white/20 rounded-full" style={{ width: `${Math.round((w.legshots / (w.headshots + w.bodyshots + w.legshots || 1)) * 100)}%` }} title="Leg" />
            </div>
            <div className="flex gap-3 text-[10px] text-white/25">
              <span className="text-yellow-400/70">Head {w.hsPercent}%</span>
              <span className="text-blue-400/70">Body {Math.round((w.bodyshots / (w.headshots + w.bodyshots + w.legshots || 1)) * 100)}%</span>
              <span>Leg {Math.round((w.legshots / (w.headshots + w.bodyshots + w.legshots || 1)) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
