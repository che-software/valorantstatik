"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Globe, Palette } from "lucide-react";
import { useSettings, type Language, type Theme } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: "tr", flag: "🇹🇷", label: "Türkçe"  },
  { value: "en", flag: "🇬🇧", label: "English" },
  { value: "de", flag: "🇩🇪", label: "Deutsch" },
];

const THEMES: { value: Theme; label: string; preview: string; accent: string }[] = [
  { value: "dark",     label: "Koyu",         preview: "#0f1923", accent: "#FF4655" },
  { value: "darker",   label: "Daha Koyu",    preview: "#080e14", accent: "#FF4655" },
  { value: "midnight", label: "Gece Yarısı",  preview: "#0d0d1a", accent: "#7c6af7" },
  { value: "crimson",  label: "Kırmızı",      preview: "#1a0a0e", accent: "#FF4655" },
];

export default function SettingsPage() {
  const { settings, setLanguage, setTheme, t } = useSettings();
  const { auth } = useAuth();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const session = auth.status === "authenticated" ? auth.session : null;
  const profileHref = session?.gameName && session?.tagLine
    ? `/player/${encodeURIComponent(session.gameName)}/${encodeURIComponent(session.tagLine)}`
    : null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("nav.home")}
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center">
          <Palette className="w-5 h-5 text-[#FF4655]" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl">{t("settings.title")}</h1>
          <p className="text-white/30 text-xs">KediPotter Tracker</p>
        </div>
      </div>

      {/* Dil seçimi */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white/50 text-sm font-semibold">
          <Globe className="w-4 h-4" />
          {t("settings.language")}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => { setLanguage(lang.value); handleSave(); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all text-sm font-semibold
                ${settings.language === lang.value
                  ? "border-[#FF4655]/50 bg-[#FF4655]/10 text-white"
                  : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20"
                }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.label}</span>
              {settings.language === lang.value && (
                <Check className="w-3.5 h-3.5 text-[#FF4655] ml-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tema seçimi */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white/50 text-sm font-semibold">
          <Palette className="w-4 h-4" />
          {t("settings.theme")}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.value}
              onClick={() => { setTheme(theme.value); handleSave(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-semibold
                ${settings.theme === theme.value
                  ? "border-[#FF4655]/50 bg-[#FF4655]/10 text-white"
                  : "border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-white hover:border-white/20"
                }`}
            >
              {/* Renk önizleme */}
              <div className="flex gap-1 flex-shrink-0">
                <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: theme.preview }} />
                <div className="w-2 h-5 rounded-sm" style={{ backgroundColor: theme.accent }} />
              </div>
              <span className="flex-1 text-left">{theme.label}</span>
              {settings.theme === theme.value && (
                <Check className="w-3.5 h-3.5 text-[#FF4655]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hesap bilgisi */}
      {session && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <p className="text-white/50 text-sm font-semibold">Hesap</p>
          <div className="flex items-center gap-3">
            {session.cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.cardUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#FF4655]/15 border border-[#FF4655]/25 flex items-center justify-center">
                <span className="text-[#FF4655] font-black">{session.gameName?.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="text-white font-bold">{session.gameName}<span className="text-white/30 font-normal">#{session.tagLine}</span></p>
              {session.level > 0 && <p className="text-white/40 text-xs">Seviye {session.level}</p>}
              {session.rankName && session.rankName !== "Unranked" && (
                <div className="flex items-center gap-1 mt-0.5">
                  {session.rankIcon && <img src={session.rankIcon} alt="" className="w-4 h-4" />}
                  <span className="text-white/40 text-xs">{session.rankName} · {session.rr} RR</span>
                </div>
              )}
            </div>
            {profileHref && (
              <Link href="/stats/me"
                className="ml-auto px-3 py-1.5 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/20 text-[#FF4655] text-xs font-semibold hover:bg-[#FF4655]/20 transition-colors">
                {t("nav.mystats")}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Kaydet bildirimi */}
      {saved && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg">
          <Check className="w-4 h-4" />
          {t("settings.saved")}
        </div>
      )}
    </main>
  );
}
