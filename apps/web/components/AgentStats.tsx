import Image from "next/image";
import { TransformedMatch } from "@/lib/transformer";

export default function AgentStats({ matches, playerName, playerTag }: {
  matches: TransformedMatch[];
  playerName: string;
  playerTag: string;
}) {
  const map: Record<string, { games: number; wins: number; kills: number; deaths: number; icon: string }> = {};

  for (const m of matches) {
    const p = m.players.find(
      x => x.name.toLowerCase() === playerName.toLowerCase() && x.tag.toLowerCase() === playerTag.toLowerCase()
    );
    if (!p) continue;
    const a = p.character;
    if (!map[a]) map[a] = { games: 0, wins: 0, kills: 0, deaths: 0, icon: p.agentIcon };
    map[a].games++;
    if (m.teams[p.team as "red" | "blue"]?.won) map[a].wins++;
    map[a].kills  += p.stats.kills;
    map[a].deaths += Math.max(p.stats.deaths, 1);
  }

  const stats = Object.entries(map)
    .map(([agent, s]) => ({ agent, ...s, kd: (s.kills / s.deaths).toFixed(2), wr: Math.round((s.wins / s.games) * 100) }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 3);

  if (!stats.length) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-[#ff4654] font-bold text-sm uppercase tracking-widest mb-4">En Çok Oynanan Ajanlar</h3>
      <div className="space-y-4">
        {stats.map(s => (
          <div key={s.agent} className="flex items-center gap-4">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image src={s.icon} alt={s.agent} fill className="rounded-lg object-cover" unoptimized />
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-white font-semibold text-sm">{s.agent}</span>
                <span className="text-white/50 text-xs">{s.games} maç</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#ff4654] rounded-full" style={{ width: `${s.wr}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/40 text-xs">{s.wr}% WR</span>
                <span className="text-white/40 text-xs">{s.kd} K/D</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
