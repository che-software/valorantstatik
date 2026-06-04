export function SkeletonCard() {
  return (
    <div className="glass-card animate-pulse p-6 rounded-2xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded" />
        <div className="h-3 bg-white/10 rounded w-5/6" />
        <div className="h-3 bg-white/10 rounded w-4/6" />
      </div>
    </div>
  );
}

export function SkeletonMatch() {
  return (
    <div className="glass-card animate-pulse rounded-xl overflow-hidden border border-white/[0.05]">
      <div className="flex items-center gap-3 p-3 pl-4">
        {/* Sol çizgi */}
        <div className="w-[3px] self-stretch rounded-full bg-white/10 flex-shrink-0" />
        {/* Ajan ikonu */}
        <div className="w-11 h-11 rounded-lg bg-white/10 flex-shrink-0" />
        {/* Bilgi */}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-4 bg-white/10 rounded w-16" />
            <div className="h-4 bg-white/10 rounded w-20" />
          </div>
          <div className="flex gap-2">
            <div className="h-3 bg-white/10 rounded w-24" />
            <div className="h-3 bg-white/10 rounded w-16" />
          </div>
        </div>
        {/* KDA */}
        <div className="space-y-1.5 text-right">
          <div className="h-4 bg-white/10 rounded w-20 ml-auto" />
          <div className="h-3 bg-white/10 rounded w-24 ml-auto" />
        </div>
        {/* Skor */}
        <div className="hidden md:block w-12 h-7 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function SkeletonStatsOverview() {
  return (
    <div className="glass-card animate-pulse rounded-2xl overflow-hidden border border-white/[0.06]">
      {/* Başlık */}
      <div className="px-5 py-3 border-b border-white/[0.05] flex justify-between">
        <div className="h-3 bg-white/10 rounded w-32" />
        <div className="h-3 bg-white/10 rounded w-16" />
      </div>
      <div className="p-5 space-y-5">
        {/* Rank kartları */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/[0.04] rounded-xl p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 bg-white/10 rounded w-20" />
              <div className="h-4 bg-white/10 rounded w-28" />
              <div className="h-2.5 bg-white/10 rounded w-16" />
            </div>
          </div>
          <div className="flex-1 bg-white/[0.03] rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2.5 bg-white/10 rounded w-16" />
              <div className="h-4 bg-white/10 rounded w-24" />
            </div>
          </div>
        </div>
        {/* Win rate bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 bg-white/10 rounded w-24" />
            <div className="h-3 bg-white/10 rounded w-10" />
          </div>
          <div className="h-2 bg-white/10 rounded-full" />
        </div>
        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white/[0.04] rounded-xl p-3 space-y-2">
              <div className="w-4 h-4 bg-white/10 rounded mx-auto" />
              <div className="h-6 bg-white/10 rounded w-12 mx-auto" />
              <div className="h-0.5 bg-white/10 rounded-full" />
              <div className="h-2.5 bg-white/10 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
