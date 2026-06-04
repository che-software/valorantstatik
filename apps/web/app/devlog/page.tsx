// Devlog sayfası — content/devlog/*.json dosyalarından dinamik olarak yüklenir
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Wrench, Zap, Shield, Globe } from "lucide-react";
import { getEntries, type DevlogEntry } from "@/lib/services/devlog-manager";

export const metadata: Metadata = {
  title: "Devlog · Geliştirici Günlüğü",
  description: "KediPotter Tracker geliştirme süreci, teknik güncellemeler ve Riot API uyumluluk çalışmaları.",
};

// Her deploy'da yeniden oluşturulsun (ISR değil, static)
export const dynamic = "force-dynamic";

const CATEGORY_STYLES = {
  api:         { color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20",     icon: <Globe  className="w-3.5 h-3.5" />, label: "API" },
  ui:          { color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20", icon: <Zap    className="w-3.5 h-3.5" />, label: "UI/UX" },
  security:    { color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20",   icon: <Shield className="w-3.5 h-3.5" />, label: "Güvenlik" },
  performance: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20", icon: <Wrench className="w-3.5 h-3.5" />, label: "Performans" },
} as const;

const STATUS_ICON = {
  done:     <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />,
  progress: <Clock       className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 animate-pulse" />,
  planned:  <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />,
};

const STATUS_TEXT = {
  done:     "text-white/60",
  progress: "text-white/60",
  planned:  "text-white/30",
};

export default async function DevlogPage() {
  const logs = await getEntries();

  return (
    <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
      </Link>

      {/* Başlık */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-[#FF4655]" />
          </div>
          <div>
            <h1 className="text-white font-black text-2xl">Geliştirici Günlüğü</h1>
            <p className="text-white/30 text-xs">Ürün günlüğü · KediPotter Tracker</p>
          </div>
        </div>
        <p className="text-white/40 text-sm leading-relaxed mt-4">
          Projenin gelişim sürecini, teknik kararları ve Riot Games API uyumluluk
          çalışmalarını şeffaf bir şekilde belgeliyoruz.
        </p>
      </div>

      {/* API Durum Kartı */}
      <div className="glass-card rounded-2xl p-4 mb-8 border border-white/8">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Sistem Durumu</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "API Bağlantısı",      value: "Kararlı",       color: "text-green-400",  dot: "bg-green-400" },
            { label: "Vanguard Uyumluluğu", value: "Doğrulandı",    color: "text-green-400",  dot: "bg-green-400" },
            { label: "Riot Production API", value: "Aktif", color: "text-green-400", dot: "bg-green-400" },
            { label: "Uptime",              value: "99.9%",         color: "text-green-400",  dot: "bg-green-400" },
            { label: "Cache Sistemi",       value: "Aktif",         color: "text-blue-400",   dot: "bg-blue-400" },
            { label: "Rate Limiter",        value: "Aktif",         color: "text-blue-400",   dot: "bg-blue-400" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
              <div>
                <p className="text-white/30 text-[10px]">{s.label}</p>
                <p className={`text-xs font-semibold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log girişleri */}
      {logs.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-10">Henüz devlog girişi yok.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log: DevlogEntry) => {
            const cat = CATEGORY_STYLES[log.category] ?? CATEGORY_STYLES.api;
            return (
              <div key={log.version} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                        {cat.icon} {cat.label}
                      </span>
                      <span className="text-white/20 text-[10px] font-mono">{log.version}</span>
                    </div>
                    <h2 className="text-white font-bold text-sm">{log.title}</h2>
                  </div>
                  <span className="text-white/25 text-xs flex-shrink-0">
                    {new Date(log.date).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })}
                  </span>
                </div>

                <ul className="space-y-2">
                  {log.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
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

      <p className="text-white/15 text-[11px] leading-relaxed mt-10">
        KediPotter Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
        opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
      </p>
    </main>
  );
}
