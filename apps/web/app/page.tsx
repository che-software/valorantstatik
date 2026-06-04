"use client";
// Ana sayfa — merkezi hero arama alanı
import SearchBar from "@/components/SearchBar";
import { BarChart2, Shield, Trophy } from "lucide-react";

const features = [
  { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Detaylı İstatistik" },
  { icon: <Shield    className="w-3.5 h-3.5" />, label: "Rank Takibi" },
  { icon: <Trophy    className="w-3.5 h-3.5" />, label: "Leaderboard" },
];

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden min-h-[calc(100vh-56px)]">
      {/* Ambient arka plan ışıması */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#FF4655]/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF4655]/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-10 py-20">
        {/* Başlık */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
            Kedi<span className="text-[#FF4655]">Potter</span>
            <br />
            <span className="text-3xl sm:text-4xl text-white/60 font-bold">Tracker</span>
          </h1>
          <p className="text-white/35 text-sm tracking-widest uppercase">
            Valorant İstatistik Platformu
          </p>
        </div>

        {/* Hero arama çubuğu — tam ortada, devasa */}
        <SearchBar />

        {/* Özellik etiketleri */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {features.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-white/35 text-xs"
            >
              {f.icon}
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
