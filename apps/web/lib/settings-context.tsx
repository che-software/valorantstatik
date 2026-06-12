"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "tr" | "en" | "de";
export type Theme    = "dark" | "darker" | "midnight" | "crimson";

interface Settings {
  language: Language;
  theme:    Theme;
}

interface SettingsContextValue {
  settings:    Settings;
  setLanguage: (l: Language) => void;
  setTheme:    (t: Theme)    => void;
  t:           (key: string) => string;
}

const DEFAULTS: Settings = { language: "en", theme: "dark" };
const STORAGE_KEY = "vt_settings";

// ── Çeviri tablosu ────────────────────────────────────────────────────────────
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  tr: {
    "nav.home":          "Ana Sayfa",
    "nav.leaderboard":   "Leaderboard",
    "nav.devlog":        "Devlog",
    "nav.about":         "Hakkında",
    "nav.contact":       "İletişim",
    "nav.signin":        "Riot ile Giriş",
    "nav.mystats":       "İstatistiklerim",
    "nav.settings":      "Ayarlar",
    "nav.logout":        "Çıkış Yap",
    "settings.title":    "Ayarlar",
    "settings.language": "Dil",
    "settings.theme":    "Tema",
    "settings.saved":    "Kaydedildi",
    "theme.dark":        "Koyu (Varsayılan)",
    "theme.darker":      "Daha Koyu",
    "theme.midnight":    "Gece Yarısı",
    "theme.crimson":     "Kırmızı",
    "lang.tr":           "Türkçe",
    "lang.en":           "English",
    "lang.de":           "Deutsch",
  },
  en: {
    "nav.home":          "Home",
    "nav.leaderboard":   "Leaderboard",
    "nav.devlog":        "Devlog",
    "nav.about":         "About",
    "nav.contact":       "Contact",
    "nav.signin":        "Sign in with Riot",
    "nav.mystats":       "My Stats",
    "nav.settings":      "Settings",
    "nav.logout":        "Log Out",
    "settings.title":    "Settings",
    "settings.language": "Language",
    "settings.theme":    "Theme",
    "settings.saved":    "Saved",
    "theme.dark":        "Dark (Default)",
    "theme.darker":      "Darker",
    "theme.midnight":    "Midnight",
    "theme.crimson":     "Crimson",
    "lang.tr":           "Türkçe",
    "lang.en":           "English",
    "lang.de":           "Deutsch",
  },
  de: {
    "nav.home":          "Startseite",
    "nav.leaderboard":   "Rangliste",
    "nav.devlog":        "Devlog",
    "nav.about":         "Über uns",
    "nav.contact":       "Kontakt",
    "nav.signin":        "Mit Riot anmelden",
    "nav.mystats":       "Meine Statistiken",
    "nav.settings":      "Einstellungen",
    "nav.logout":        "Abmelden",
    "settings.title":    "Einstellungen",
    "settings.language": "Sprache",
    "settings.theme":    "Design",
    "settings.saved":    "Gespeichert",
    "theme.dark":        "Dunkel (Standard)",
    "theme.darker":      "Dunkler",
    "theme.midnight":    "Mitternacht",
    "theme.crimson":     "Karmesin",
    "lang.tr":           "Türkçe",
    "lang.en":           "English",
    "lang.de":           "Deutsch",
  },
};

// ── Tema CSS değişkenleri ─────────────────────────────────────────────────────
const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark: {
    "--bg-primary":   "#0f1923",
    "--bg-secondary": "#0a1117",
    "--accent":       "#FF4655",
  },
  darker: {
    "--bg-primary":   "#080e14",
    "--bg-secondary": "#050a0f",
    "--accent":       "#FF4655",
  },
  midnight: {
    "--bg-primary":   "#0d0d1a",
    "--bg-secondary": "#080812",
    "--accent":       "#7c6af7",
  },
  crimson: {
    "--bg-primary":   "#1a0a0e",
    "--bg-secondary": "#120608",
    "--accent":       "#FF4655",
  },
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // localStorage'dan yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* devam */ }
  }, []);

  // Tema CSS değişkenlerini uygula — documentElement'e set et
  useEffect(() => {
    const vars = THEME_VARS[settings.theme] ?? THEME_VARS.dark;
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute("data-theme", settings.theme);
    // body'ye gradient uygula
    document.body.style.background = `radial-gradient(ellipse at 20% 0%, color-mix(in srgb, ${vars["--accent"]} 8%, ${vars["--bg-secondary"]}) 0%, ${vars["--bg-primary"]} 40%, ${vars["--bg-secondary"]} 100%)`;
  }, [settings.theme]);

  function save(next: Settings) {
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function setLanguage(language: Language) { save({ ...settings, language }); }
  function setTheme(theme: Theme)          { save({ ...settings, theme });    }

  function t(key: string): string {
    return TRANSLATIONS[settings.language]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  return (
    <SettingsContext.Provider value={{ settings, setLanguage, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
