// Devlog page — dynamically loaded from content/devlog/*.json
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Wrench, Zap, Shield, Globe, Server } from "lucide-react";
import { getEntries, type DevlogEntry } from "@/lib/services/devlog-manager";

export const metadata: Metadata = {
  title: "Devlog · Developer Journal",
  description: "Che Tracker development history — technical updates, architecture decisions and Riot API compliance work.",
};

export const dynamic = "force-dynamic";

// ── Category styles ───────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  api:            { color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20",     icon: <Globe  className="w-3.5 h-3.5" />, label: "API"            },
  ui:             { color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", icon: <Zap    className="w-3.5 h-3.5" />, label: "UI / UX"        },
  security:       { color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/20",icon:<Shield className="w-3.5 h-3.5" />, label: "Security"       },
  performance:    { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", icon: <Wrench className="w-3.5 h-3.5" />, label: "Performance"    },
  infrastructure: { color: "text-rose-400",   bg: "bg-rose-400/10 border-rose-400/20",     icon: <Server className="w-3.5 h-3.5" />, label: "Infrastructure" },
} as const;

// ── Status indicators ─────────────────────────────────────────────────────────
const STATUS_ICON = {
  done:     <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />,
  progress: <Clock       className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5 animate-pulse" />,
  planned:  <div         className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0 mt-0.5" />,
};

const STATUS_TEXT = {
  done:     "text-white/55",
  progress: "text-white/60",
  planned:  "text-white/25",
};

// ── System status items ───────────────────────────────────────────────────────
const SYSTEM_STATUS = [
  { label: "API Connection",    value: "Stable",    color: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "Riot Compliance",   value: "Verified",  color: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "Production API",    value: "Active",    color: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "MongoDB Atlas",     value: "Connected", color: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "Cache Layer",       value: "Active",    color: "text-blue-400",    dot: "bg-blue-400"    },
  { label: "Rate Limiter",      value: "Active",    color: "text-blue-400",    dot: "bg-blue-400"    },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function DevlogPage() {
  const logs = await getEntries();

  return (
    <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">

      {/* Back link */}
      <Link href="/"
        className="inline-flex items-center gap-2 text-white/35 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20
                          flex items-center justify-center">
            <Wrench className="w-5 h-5 text-[#FF4655]" />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">Developer Journal</h1>
            <p className="text-white/30 text-xs">Product log · Che Tracker by Che-Software</p>
          </div>
        </div>
        <p className="text-white/35 text-sm leading-relaxed mt-4">
          Transparent documentation of Che Tracker&apos;s development — architecture decisions,
          technical milestones and Riot Games API compliance work.
        </p>
      </div>

      {/* System status card */}
      <div className="glass rounded-2xl p-4 mb-8 border border-white/[0.07]">
        <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold mb-3">
          System Status
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SYSTEM_STATUS.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
              <div>
                <p className="text-white/28 text-[10px]">{s.label}</p>
                <p className={`text-xs font-semibold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-10">No devlog entries yet.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log: DevlogEntry) => {
            const cat = CATEGORY_STYLES[log.category as keyof typeof CATEGORY_STYLES]
              ?? CATEGORY_STYLES.api;

            return (
              <div key={log.version} className="glass rounded-2xl p-5 border border-white/[0.06]
                                                 hover:border-white/[0.10] transition-colors">
                {/* Entry header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {/* Category badge */}
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold
                                        px-2.5 py-1 rounded-full border ${cat.bg} ${cat.color}`}>
                        {cat.icon}
                        {cat.label}
                      </span>
                      {/* Version tag */}
                      <span className="text-white/20 text-[10px] font-mono bg-white/[0.04]
                                       border border-white/[0.06] px-2 py-0.5 rounded-full">
                        {log.version}
                      </span>
                    </div>
                    <h2 className="text-white font-bold text-sm leading-snug">{log.title}</h2>
                  </div>
                  {/* Date */}
                  <span className="text-white/22 text-xs flex-shrink-0 pt-0.5">
                    {new Date(log.date).toLocaleDateString("en-GB", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>

                {/* Item list */}
                <ul className="space-y-2.5">
                  {log.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      {STATUS_ICON[item.status] ?? STATUS_ICON.planned}
                      <span className={`text-sm leading-relaxed ${STATUS_TEXT[item.status] ?? STATUS_TEXT.planned}`}>
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Riot legal */}
      <p className="text-white/12 text-[11px] leading-relaxed mt-10">
        Che Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
        opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
      </p>
    </main>
  );
}
