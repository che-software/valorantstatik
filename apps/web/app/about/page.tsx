// Hakkımızda — Platform bilgisi ve Riot uyumluluk özeti
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart2, Code2, Heart, Shield, Lock, FileText, Eye, UserX } from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Che Tracker hakkında bilgi, gizlilik özeti ve Riot Games geliştirici uyumluluğu.",
};

const PRIVACY_SECTIONS = [
  {
    icon: <Eye className="w-4 h-4 text-[#FF4655]" />,
    title: "Hangi Veriler Görüntülenir?",
    content:
      "Platform, Riot Games API kuralları ve izin verilen kapsamda oyun içi istatistikleri gösterir. Oyuncu verilerinin herkese açık görünürlüğü, RSO ve ilgili Riot politikalarına uygun kullanıcı onayına bağlıdır. Ad, e-posta veya adres gibi ek kimlik bilgisi toplanmaz.",
  },
  {
    icon: <Lock className="w-4 h-4 text-[#FF4655]" />,
    title: "Veri Güvenliği",
    content:
      "Profil verileri performans için geçici olarak önbelleklenebilir. Tüm iletişim HTTPS üzerinden yapılır. API anahtarları ve istemci sırları yalnızca sunucu tarafında tutulur.",
  },
  {
    icon: <UserX className="w-4 h-4 text-[#FF4655]" />,
    title: "Veri Silme Talebi",
    content:
      "Profilinizin platformdan kaldırılmasını veya onayınızın işlenmesini durdurmayı talep etmek için İletişim sayfasından bize yazabilirsiniz.",
  },
  {
    icon: <FileText className="w-4 h-4 text-[#FF4655]" />,
    title: "Çerezler ve İzleme",
    content:
      "Site, temel işlevsellik ve güvenli oturum için gerekli çerezleri kullanır. Davranışsal reklam çerezleri kullanılmaz.",
  },
  {
    icon: <Shield className="w-4 h-4 text-[#FF4655]" />,
    title: "Riot Games uyumluluğu",
    content:
      "Uygulama Riot Games Developer Policy ve VALORANT ürün kurallarına uygun şekilde geliştirilmiştir. Production API ve RSO (Riot Sign-On) kullanımı, Riot’un geliştirici koşulları ve veri paylaşımı gereksinimleriyle sınırlıdır.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
      </Link>

      <div className="glass-card rounded-3xl p-8 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4655]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FF4655]/15 border border-[#FF4655]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-black text-[#FF4655]">K</span>
          </div>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">KediPotter Tracker</h1>
            <p className="text-[#FF4655] text-sm font-medium mt-0.5">Valorant İstatistik Platformu</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400/95 font-medium">
                Riot Developer Policy uyumlu
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
                Production API + RSO
              </span>
            </div>
          </div>
        </div>
        <p className="text-white/50 text-sm leading-relaxed mt-6">
          KediPotter Tracker, VALORANT oyuncularının maç istatistiklerini, rank gelişimini ve performans metriklerini
          takip etmeleri için geliştirilmiştir. Uygulama Riot Games geliştirici programı kapsamında kayıtlıdır; Riot
          Games, Inc. ile bağlı bir kuruluş veya iştirak değildir.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: <BarChart2 className="w-5 h-5 text-[#FF4655]" />, title: "Derin Analiz", desc: "Silah, harita ve ajan bazlı detaylı istatistikler" },
          { icon: <Shield className="w-5 h-5 text-[#FF4655]" />, title: "Rank Takibi", desc: "ELO, RR ve peak rank bilgileri" },
          { icon: <Heart className="w-5 h-5 text-[#FF4655]" />, title: "Oyuncu odaklı", desc: "Onay ve şeffaflık öncelikli deneyim" },
        ].map(f => (
          <div key={f.title} className="glass-card rounded-2xl p-4 space-y-2">
            {f.icon}
            <p className="text-white font-semibold text-sm">{f.title}</p>
            <p className="text-white/40 text-xs">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-[#FF4655]" />
          <h2 className="text-white font-bold text-sm uppercase tracking-widest">Teknoloji</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Next.js 16", "TypeScript", "Tailwind CSS", "Prisma", "MongoDB", "Redis", "Framer Motion", "HenrikDev API", "Resend"].map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-white/50">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[#FF4655]" />
          <h2 className="text-white font-bold text-sm uppercase tracking-widest">Gizlilik özeti</h2>
          <span className="text-white/20 text-xs ml-auto">Son güncelleme: Mayıs 2026</span>
        </div>

        <div className="space-y-3">
          {PRIVACY_SECTIONS.map(s => (
            <div key={s.title} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {s.icon}
                <h3 className="text-white font-semibold text-sm">{s.title}</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-6 border border-white/8">
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Üçüncü taraf hizmetler</p>
        <div className="space-y-2 text-xs text-white/40 leading-relaxed">
          <p>
            • <span className="text-white/60">Riot Games API</span> — Resmi oyun verisi; Riot’un geliştirici ve gizlilik
            koşulları geçerlidir.
          </p>
          <p>
            • <span className="text-white/60">HenrikDev API</span> — Topluluk veri uçları; henrikdev.xyz politikaları
            geçerlidir.
          </p>
          <p>
            • <span className="text-white/60">Vercel</span> — Barındırma; vercel.com/legal.
          </p>
          <p>
            • <span className="text-white/60">MongoDB Atlas</span> — Veritabanı; mongodb.com politikaları geçerlidir.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 mb-6 border border-[#FF4655]/10">
        <p className="text-white/40 text-sm">
          Gizlilik ile ilgili sorularınız veya veri silme talepleriniz için{" "}
          <Link href="/contact" className="text-[#FF4655] hover:underline">
            İletişim sayfasını
          </Link>{" "}
          kullanabilirsiniz.
        </p>
      </div>

      <p className="text-white/20 text-[11px] leading-relaxed text-center">
        KediPotter Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or
        anyone officially involved in producing or managing Riot Games properties. Riot Games, VALORANT, and all
        associated properties are trademarks or registered trademarks of Riot Games, Inc.
      </p>
    </main>
  );
}
