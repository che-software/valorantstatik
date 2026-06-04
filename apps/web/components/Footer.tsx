// Footer — Riot Games Developer Policy uyumlu yasal metin + navigasyon
import Link from "next/link";
import { Crosshair, Shield } from "lucide-react";

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/",             label: "Ana Sayfa" },
  { href: "/leaderboard",  label: "Leaderboard" },
  { href: "/about",        label: "Hakkında" },
  { href: "/contact",      label: "İletişim" },
  { href: "/privacy",      label: "Gizlilik Politikası" },
  { href: "/terms",        label: "Kullanım Koşulları" },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-[#080d12]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#FF4655] rounded-lg flex items-center justify-center shadow-lg shadow-[#FF4655]/20">
                <Crosshair className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-black tracking-tight">
                KediPotter<span className="text-[#FF4655]">Tracker</span>
              </span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed">
              Valorant oyuncuları için ücretsiz istatistik platformu. Riot Games Developer Policy ve üretim API
              kurallarına uyumlu, RSO (Riot Sign-On) ile oyuncu onayına dayalı veri kullanımı.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a href="https://discord.gg/codevra" target="_blank" rel="noopener noreferrer"
                aria-label="Discord sunucumuza katıl"
                className="text-white/25 hover:text-[#5865F2] transition-colors">
                <DiscordIcon />
              </a>
              <a href="https://github.com/ensare646-bot" target="_blank" rel="noopener noreferrer"
                aria-label="GitHub deposunu görüntüle"
                className="text-white/25 hover:text-white transition-colors">
                <GitHubIcon />
              </a>
            </div>
          </div>

          {/* Navigasyon */}
          <div className="space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Sayfalar</p>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="block text-white/30 hover:text-[#FF4655] text-sm transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Geliştirici & API Durumu */}
          <div className="space-y-2">
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Geliştirici</p>
            <p className="text-white/40 text-sm font-medium">KediPotter</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Shield className="w-3 h-3 text-emerald-400/80" />
              <p className="text-emerald-400/85 text-xs leading-snug">
                Riot Games geliştirici programı kapsamında kayıtlı ürün; Production API ve RSO kullanımı.
              </p>
            </div>
            <p className="text-white/20 text-xs leading-relaxed mt-2">
              Veri kaynağı: Riot Games API ve topluluk veri uçları (ör. HenrikDev).
            </p>
          </div>
        </div>

        {/* ── Riot Games Developer Policy Zorunlu Yasal Metin ── */}
        <div className="border-t border-white/5 pt-6 space-y-3">
          {/* Ana disclaimer — Riot'un tam olarak istediği metin */}
          <p className="text-white/25 text-[11px] leading-relaxed max-w-4xl">
            <strong className="text-white/40 font-semibold">Legal Disclaimer: </strong>
            KediPotter Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
            opinions of Riot Games or anyone officially involved in producing or managing Riot Games
            properties. Riot Games, VALORANT, Legends of Runeterra, Teamfight Tactics, League of Legends,
            League of Legends: Wild Rift, and all associated properties are trademarks or registered
            trademarks of Riot Games, Inc.
          </p>

          {/* Alt satır — telif + linkler */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-white/15 text-[11px]">
              © {new Date().getFullYear()} KediPotterTracker · Bağımsız geliştirici ürünü · Riot Games, Inc. ile bağlı
              kuruluş değildir
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy"
                className="text-white/20 hover:text-white/40 text-[11px] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms"
                className="text-white/20 hover:text-white/40 text-[11px] transition-colors">
                Terms of Service
              </Link>
              <a href="https://www.riotgames.com/en/legal" target="_blank" rel="noopener noreferrer"
                className="text-white/20 hover:text-white/40 text-[11px] transition-colors">
                Riot Legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
