"use client";
// Tilt Metre — oyuncunun mental durumunu görselleştirir
import { TiltStats } from "@/lib/advanced-stats";
import { Brain } from "lucide-react";

const LEVEL_COLORS = {
  fresh:    { bar: "bg-green-400",  text: "text-green-400",  border: "border-green-400/20",  bg: "bg-green-400/5"  },
  focused:  { bar: "bg-blue-400",   text: "text-blue-400",   border: "border-blue-400/20",   bg: "bg-blue-400/5"   },
  tilting:  { bar: "bg-yellow-400", text: "text-yellow-400", border: "border-yellow-400/20", bg: "bg-yellow-400/5" },
  tilted:   { bar: "bg-orange-400", text: "text-orange-400", border: "border-orange-400/20", bg: "bg-orange-400/5" },
  rest:     { bar: "bg-red-400",    text: "text-red-400",    border: "border-red-400/20",    bg: "bg-red-400/5"    },
};

export default function TiltMeter({ tilt }: { tilt: TiltStats }) {
  const c = LEVEL_COLORS[tilt.level];

  return (
    <div className={`glass-card rounded-2xl p-5 border ${c.border} ${c.bg}`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className={`w-4 h-4 ${c.text}`} />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Mental State</h3>
        <span className="ml-auto text-lg">{tilt.emoji}</span>
      </div>

      {/* Skor çubuğu */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-sm font-black ${c.text}`}>{tilt.label}</span>
          <span className="text-white/40 text-xs">{tilt.score}/100</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${c.bar}`}
            style={{ width: `${tilt.score}%` }} />
        </div>
      </div>

      {/* Tavsiye */}
      <p className="text-white/60 text-xs leading-relaxed mb-3 italic">
        &ldquo;{tilt.advice}&rdquo;
      </p>

      {/* Mini istatistikler */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className={`text-sm font-black ${tilt.recentWinRate >= 50 ? "text-green-400" : "text-red-400"}`}>
            %{tilt.recentWinRate}
          </p>
          <p className="text-white/30 text-[10px]">Last 5 Games</p>
        </div>
        <div className="text-center">
          <p className={`text-sm font-black ${tilt.kdTrend >= 0 ? "text-green-400" : "text-red-400"}`}>
            {tilt.kdTrend >= 0 ? "+" : ""}{tilt.kdTrend}
          </p>
          <p className="text-white/30 text-[10px]">K/D Trend</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white/70">{tilt.firstBloodRate}%</p>
          <p className="text-white/30 text-[10px]">Aggression</p>
        </div>
      </div>

      {/* Göstergeler */}
      {tilt.indicators.length > 0 && (
        <ul className="space-y-1">
          {tilt.indicators.map((ind, i) => (
            <li key={i} className="text-white/40 text-[11px] flex items-start gap-1.5">
              <span className="mt-0.5 flex-shrink-0">•</span>
              {ind}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
