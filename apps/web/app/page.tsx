"use client";
import SearchBar from "@/components/SearchBar";
import { BarChart2, Shield, Trophy, Zap, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

// ── Feature cards shown below the search bar ─────────────────────────────────
const FEATURES = [
  {
    icon:  <BarChart2 className="w-5 h-5" />,
    label: "Deep Stats",
    desc:  "ACS, ADR, HS%, K/D trend across every match.",
    color: "from-rose-500/20 to-transparent",
    delay: "delay-100",
  },
  {
    icon:  <Shield className="w-5 h-5" />,
    label: "Rank Tracking",
    desc:  "Current rank, RR change, ELO history at a glance.",
    color: "from-violet-500/20 to-transparent",
    delay: "delay-200",
  },
  {
    icon:  <Trophy className="w-5 h-5" />,
    label: "Leaderboard",
    desc:  "Top players by region — updated in real-time.",
    color: "from-amber-500/20 to-transparent",
    delay: "delay-300",
  },
  {
    icon:  <Zap className="w-5 h-5" />,
    label: "Tilt Meter",
    desc:  "AI-powered mental coach based on your recent games.",
    color: "from-cyan-500/20 to-transparent",
    delay: "delay-400",
  },
];

// ── Small stat counters above the headline ───────────────────────────────────
const STATS = [
  { value: "10M+",  label: "Matches Tracked" },
  { value: "500K+", label: "Players Profiled" },
  { value: "99.9%", label: "API Uptime"       },
];

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center relative overflow-hidden">

      {/* ── Ambient background glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Primary centre glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]
                        bg-[#FF4655]/[0.07] rounded-full blur-[160px]" />
        {/* Secondary bottom-right accent */}
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px]
                        bg-violet-600/[0.04] rounded-full blur-[140px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Hero section ── */}
      <section className="relative z-10 w-full max-w-3xl mx-auto px-4
                          flex flex-col items-center text-center
                          pt-24 pb-16 sm:pt-32 sm:pb-20 space-y-10">

        {/* Top badge */}
        <div className="animate-fade-up inline-flex items-center gap-2
                        px-3.5 py-1.5 rounded-full
                        border border-[#FF4655]/25 bg-[#FF4655]/8
                        text-[#FF4655] text-xs font-semibold tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4655] animate-pulse-glow" />
          Riot-Compliant · Production API
        </div>

        {/* Headline */}
        <div className="animate-fade-up delay-100 space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-[0.95] tracking-tight">
            <span className="block text-white/90">Elevate Your</span>
            <span className="block">
              <span className="text-[#FF4655]">Valorant</span>
              {" "}Game
            </span>
          </h1>
          <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Professional stats, rank tracking and match analytics —
            built by{" "}
            <span className="text-white/60 font-semibold">Che-Software</span>.
          </p>
        </div>

        {/* Micro stat counters */}
        <div className="animate-fade-up delay-200 flex items-center gap-6 sm:gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-white text-xl sm:text-2xl font-black">{s.value}</p>
              <p className="text-white/30 text-[11px] uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search bar — the main CTA */}
        <div className="animate-fade-up delay-300 w-full">
          <SearchBar />
        </div>

        {/* Hint */}
        <p className="animate-fade-up delay-400 text-white/20 text-xs">
          Try{" "}
          <button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[type="text"]');
              if (input) { input.value = "TenZ#0000"; input.focus(); }
            }}
            className="text-white/40 hover:text-[#FF4655] transition-colors underline underline-offset-2"
          >
            TenZ#0000
          </button>
          {" "}or{" "}
          <Link href="/leaderboard" className="text-white/40 hover:text-[#FF4655] transition-colors underline underline-offset-2">
            browse the leaderboard
          </Link>
        </p>
      </section>

      {/* ── Feature cards ── */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-24">
        {/* Section label */}
        <p className="text-center text-white/20 text-xs uppercase tracking-[0.2em] mb-8">
          What Che Tracker gives you
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className={`animate-fade-up ${f.delay} relative overflow-hidden rounded-2xl
                          glass border border-white/[0.06] p-5 group
                          hover:border-white/[0.12] hover:bg-white/[0.05] transition-all`}
            >
              {/* Gradient tint */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

              <div className="relative z-10 space-y-2.5">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08]
                                flex items-center justify-center text-[#FF4655]
                                group-hover:bg-[#FF4655]/10 group-hover:border-[#FF4655]/25 transition-all">
                  {f.icon}
                </div>

                <p className="text-white text-sm font-bold">{f.label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof row */}
        <div className="mt-10 flex items-center justify-center gap-6 flex-wrap">
          {[
            { icon: <Users  className="w-3.5 h-3.5" />, text: "Trusted by 500K+ players" },
            { icon: <Shield className="w-3.5 h-3.5" />, text: "Riot Developer Policy compliant" },
            { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "Real-time data via HenrikDev API" },
          ].map((item) => (
            <span
              key={item.text}
              className="inline-flex items-center gap-2 text-white/30 text-xs"
            >
              <span className="text-[#FF4655]/60">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
