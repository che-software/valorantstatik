"use client";
import { useMemo } from "react";
import { TransformedMatch } from "@/lib/transformer";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KdaTrendChartProps {
  matches: TransformedMatch[];
  playerName: string;
  playerTag: string;
}

interface MatchPoint {
  index: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  won: boolean;
  map: string;
  date: string;
}

// SVG polyline path oluşturucu
function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

// Değeri SVG Y koordinatına çevir
function toY(value: number, min: number, max: number, height: number, padding: number): number {
  if (max === min) return height / 2;
  return padding + ((max - value) / (max - min)) * (height - padding * 2);
}

export default function KdaTrendChart({ matches, playerName, playerTag }: KdaTrendChartProps) {
  // En yeni maç sağda olsun — ters çevir
  const points = useMemo<MatchPoint[]>(() => {
    return [...matches]
      .reverse()
      .map((m, i) => {
        const p = m.players.find(
          x => x.name.toLowerCase() === playerName.toLowerCase() &&
               x.tag.toLowerCase()  === playerTag.toLowerCase()
        );
        if (!p) return null;
        const team = p.team as "red" | "blue";
        const won  = m.teams[team]?.won ?? false;
        const kd   = p.stats.deaths > 0 ? p.stats.kills / p.stats.deaths : p.stats.kills;
        return {
          index:   i,
          kills:   p.stats.kills,
          deaths:  p.stats.deaths,
          assists: p.stats.assists,
          kd:      parseFloat(kd.toFixed(2)),
          won,
          map:     m.map,
          date:    new Date(m.startedAt * 1000).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        };
      })
      .filter(Boolean) as MatchPoint[];
  }, [matches, playerName, playerTag]);

  if (points.length < 2) return null;

  // Son 5 maçın trendi
  const recent = points.slice(-5);
  const recentAvgKd = recent.reduce((s, p) => s + p.kd, 0) / recent.length;
  const prevAvgKd   = points.slice(0, Math.max(1, points.length - 5)).reduce((s, p) => s + p.kd, 0) /
                      Math.max(1, points.length - 5);
  const trendDiff   = recentAvgKd - prevAvgKd;
  const trendUp     = trendDiff > 0.05;
  const trendDown   = trendDiff < -0.05;

  // SVG boyutları
  const W = 600, H = 80, PAD = 8;
  const step = (W - PAD * 2) / (points.length - 1);

  const kdValues  = points.map(p => p.kd);
  const minKd = Math.max(0, Math.min(...kdValues) - 0.2);
  const maxKd = Math.max(...kdValues) + 0.2;

  const killValues  = points.map(p => p.kills);
  const deathValues = points.map(p => p.deaths);
  const assistValues = points.map(p => p.assists);
  const allVals = [...killValues, ...deathValues, ...assistValues];
  const minVal = 0;
  const maxVal = Math.max(...allVals) + 1;

  // KDA noktaları
  const kdPoints    = points.map((p, i) => ({ x: PAD + i * step, y: toY(p.kd,      minKd, maxKd, H, PAD) }));
  const killPts     = points.map((p, i) => ({ x: PAD + i * step, y: toY(p.kills,   minVal, maxVal, H, PAD) }));
  const deathPts    = points.map((p, i) => ({ x: PAD + i * step, y: toY(p.deaths,  minVal, maxVal, H, PAD) }));
  const assistPts   = points.map((p, i) => ({ x: PAD + i * step, y: toY(p.assists, minVal, maxVal, H, PAD) }));

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Başlık */}
      <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">KDA Trend</p>
          {/* Efsane */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block rounded" />Kill</span>
            <span className="flex items-center gap-1 text-white/40"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" />Death</span>
            <span className="flex items-center gap-1 text-white/40"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Assist</span>
            <span className="flex items-center gap-1 text-white/40"><span className="w-3 h-0.5 bg-yellow-400 inline-block rounded" />K/D</span>
          </div>
        </div>
        {/* Trend göstergesi */}
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trendUp   ? "bg-green-500/15 text-green-400" :
          trendDown ? "bg-red-500/15 text-red-400" :
                      "bg-white/5 text-white/30"
        }`}>
          {trendUp   ? <TrendingUp   className="w-3.5 h-3.5" /> :
           trendDown ? <TrendingDown className="w-3.5 h-3.5" /> :
                       <Minus        className="w-3.5 h-3.5" />}
          {trendUp ? "Rising" : trendDown ? "Falling" : "Stable"}
          <span className="text-[10px] opacity-70 ml-0.5">
            ({trendDiff >= 0 ? "+" : ""}{trendDiff.toFixed(2)} K/D)
          </span>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2">
        {/* SVG grafik */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: 80 }}
            preserveAspectRatio="none"
          >
            {/* Yatay referans çizgisi (K/D = 1.0) */}
            {(() => {
              const y1 = toY(1.0, minKd, maxKd, H, PAD);
              return (
                <line x1={PAD} y1={y1} x2={W - PAD} y2={y1}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
              );
            })()}

            {/* Galibiyet/mağlubiyet arka plan bantları */}
            {points.map((p, i) => (
              <rect
                key={i}
                x={PAD + i * step - step / 2}
                y={0}
                width={step}
                height={H}
                fill={p.won ? "rgba(74,222,128,0.04)" : "rgba(239,68,68,0.04)"}
              />
            ))}

            {/* Assist çizgisi */}
            <polyline
              points={assistPts.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(96,165,250,0.5)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Death çizgisi */}
            <polyline
              points={deathPts.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(248,113,113,0.7)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Kill çizgisi */}
            <polyline
              points={killPts.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(74,222,128,0.9)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* K/D çizgisi — en üstte, kalın */}
            <polyline
              points={kdPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(250,204,21,0.9)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* K/D nokta işaretçileri */}
            {kdPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={points[i].won ? "#4ade80" : "#f87171"}
                stroke="rgba(250,204,21,0.8)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        {/* Alt etiketler — maç tarihleri */}
        <div className="flex justify-between mt-1 px-1">
          {points.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: `${100 / points.length}%` }}>
              <span className={`text-[9px] font-bold ${p.won ? "text-green-400/60" : "text-red-400/60"}`}>
                {p.kills}/{p.deaths}/{p.assists}
              </span>
              <span className="text-white/20 text-[8px] hidden sm:block">{p.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Özet istatistikler */}
      <div className="px-5 pb-4 grid grid-cols-4 gap-3">
        {[
          { label: "Avg Kills",  value: (points.reduce((s, p) => s + p.kills,   0) / points.length).toFixed(1), color: "text-green-400" },
          { label: "Avg Deaths", value: (points.reduce((s, p) => s + p.deaths,  0) / points.length).toFixed(1), color: "text-red-400"   },
          { label: "Avg Assist", value: (points.reduce((s, p) => s + p.assists, 0) / points.length).toFixed(1), color: "text-blue-400"  },
          { label: "Avg K/D",    value: (points.reduce((s, p) => s + p.kd,      0) / points.length).toFixed(2), color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.03] rounded-lg p-2 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/25 text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
