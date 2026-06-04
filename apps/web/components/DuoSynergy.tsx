// Duo/Trio Sinerji Tablosu
import { DuoPartner } from "@/lib/advanced-stats";
import { Users } from "lucide-react";
import Link from "next/link";

export default function DuoSynergy({ partners }: { partners: DuoPartner[] }) {
  if (partners.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-[#FF4655]" />
        <h3 className="text-white font-bold text-sm uppercase tracking-widest">Duo Sinerji</h3>
      </div>

      <div className="space-y-3">
        {partners.map((p, i) => (
          <div key={`${p.name}#${p.tag}`} className="flex items-center gap-3">
            {/* Sıra */}
            <span className="text-white/20 text-xs w-4 text-center flex-shrink-0">{i + 1}</span>

            {/* İsim */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/player/${encodeURIComponent(p.name)}/${encodeURIComponent(p.tag)}`}
                className="text-white font-semibold text-sm hover:text-[#FF4655] transition-colors truncate block"
              >
                {p.name}<span className="text-white/30">#{p.tag}</span>
              </Link>
              <div className="flex items-center gap-2 text-[10px] text-white/30 mt-0.5">
                <span>{p.gamesPlayed} maç</span>
                <span>·</span>
                <span>En iyi: {p.bestMap} (%{p.bestMapWinRate})</span>
              </div>
            </div>

            {/* Sinerji skoru + win rate */}
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-black ${p.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                %{p.winRate}
              </p>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                {/* Sinerji bar */}
                <div className="w-12 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4655] rounded-full"
                    style={{ width: `${p.synergyScore}%` }} />
                </div>
                <span className="text-white/25 text-[10px]">{p.synergyScore}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
