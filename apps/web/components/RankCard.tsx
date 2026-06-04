import Image from "next/image";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";
import { TransformedPlayer } from "@/lib/transformer";

export default function RankCard({ player }: { player: TransformedPlayer }) {
  const { rank } = player;
  const rrChange = rank?.rrChange ?? 0;
  const isPos = rrChange >= 0;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {player.card?.small ? (
          <Image src={player.card.small} alt={player.name} width={80} height={80}
            className="rounded-full border-2 border-[#ff4654] object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-[#ff4654] bg-white/10 flex items-center justify-center">
            <span className="text-2xl font-black text-white">{player.name[0]}</span>
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 bg-[#ff4654] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {player.level}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 text-center sm:text-left">
        <h2 className="text-2xl font-black text-white tracking-wide">
          {player.name}<span className="text-white/40 font-normal text-lg">#{player.tag}</span>
        </h2>
        <p className="text-white/40 text-sm uppercase tracking-wider mt-0.5">{player.region} Sunucusu</p>
      </div>

      {/* Rank */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        {rank ? (
          <>
            <Image src={rank.iconUrl} alt={rank.name} width={64} height={64}
              className="drop-shadow-lg" unoptimized />
            <p className="text-white font-bold text-sm">{rank.name}</p>
            {/* RR Progress Bar */}
            <div className="w-24">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>{rank.rr} RR</span><span>100</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${rank.rr}%`, backgroundColor: rank.color }} />
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold ${isPos ? "text-green-400" : "text-red-400"}`}>
              {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPos ? "+" : ""}{rrChange} RR
            </div>
          </>
        ) : (
          <>
            <Shield className="w-12 h-12 text-white/20" />
            <p className="text-white/40 text-xs">Rank yok</p>
          </>
        )}
      </div>
    </div>
  );
}
