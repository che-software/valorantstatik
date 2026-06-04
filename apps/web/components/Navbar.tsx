"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Crosshair, Menu, X, ChevronDown, BarChart2, Settings, LogOut, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";

function RiotLogo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.534 21.77l-1.09-2.81-4.431 1.108L5.12 24l7.414-2.23zM2.287 16.96L0 24l3.995-1.02-.974-2.51 5.148-1.287-.687-1.773-5.195 1.55zM21.713 0L7.508 4.56l.996 2.57 9.435-2.83.687 1.772-9.388 2.81 1.03 2.656 9.342-2.8.687 1.772-9.295 2.787 1.03 2.656 9.248-2.773.688 1.772-9.202 2.76 1.03 2.656L24 16.96 21.713 0z" />
    </svg>
  );
}

// ── Profil dropdown (giriş yapılmış) ─────────────────────────────────────────
function ProfileDropdown() {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (auth.status !== "authenticated") return null;

  const { gameName, tagLine, level, cardUrl, rankName, rankIcon, rr } = auth.session;
  const initials    = gameName ? gameName.slice(0, 2).toUpperCase() : "??";
  const profileHref = gameName && tagLine
    ? `/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    : null;
  const { t } = useSettings();

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger butonu — PP + isim */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all"
      >
        {/* Profil resmi */}
        <div className="relative w-7 h-7 flex-shrink-0">
          {cardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardUrl} alt={gameName ?? ""} className="w-7 h-7 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#FF4655]/20 border border-[#FF4655]/30 flex items-center justify-center">
              <span className="text-[#FF4655] text-[10px] font-black">{initials}</span>
            </div>
          )}
          {/* Level badge */}
          {level > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-[#FF4655] text-white text-[8px] font-black px-1 rounded-full leading-tight">
              {level}
            </span>
          )}
        </div>
        <span className="text-white/80 text-xs font-semibold max-w-[100px] truncate hidden sm:block">
          {gameName ?? "Riot Hesabı"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-white/[0.08] overflow-hidden z-50"
          style={{
            background: "rgba(10,17,23,0.97)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Profil başlığı */}
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              {/* Büyük PP */}
              <div className="relative flex-shrink-0">
                {cardUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cardUrl} alt={gameName ?? ""} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#FF4655]/15 border border-[#FF4655]/25 flex items-center justify-center">
                    <span className="text-[#FF4655] text-lg font-black">{initials}</span>
                  </div>
                )}
                {level > 0 && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#FF4655] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    Lv {level}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate">{gameName}</p>
                {tagLine && <p className="text-white/30 text-xs">#{tagLine}</p>}
                {/* Rank */}
                {rankIcon && (
                  <div className="flex items-center gap-1 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rankIcon} alt={rankName} className="w-4 h-4" />
                    <span className="text-white/50 text-[10px]">{rankName}</span>
                    {rr > 0 && <span className="text-white/30 text-[10px]">· {rr} RR</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menü öğeleri */}
          <div className="py-1">
            <Link
              href="/stats/me"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-sm"
            >
              <BarChart2 className="w-4 h-4 text-[#FF4655]" />
              {t("nav.mystats")}
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-sm"
            >
              <Settings className="w-4 h-4 text-white/40" />
              {t("nav.settings")}
            </Link>
          </div>

          <div className="border-t border-white/[0.06] py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Giriş yap butonu — window.location ile hard redirect (CORS'u önler) ──────
function SignInButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { t } = useSettings();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (onClick) onClick();
    window.location.href = "/api/auth/riot/login";
  }

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        "hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FF4655]/30 bg-[#FF4655]/5 text-[#FF4655] text-xs font-semibold transition-all hover:bg-[#FF4655]/10 hover:border-[#FF4655]/50"
      }
    >
      <RiotLogo />
      <span>{t("nav.signin")}</span>
    </button>
  );
}

// ── Auth alanı — loading / unauthenticated / authenticated ───────────────────
function AuthArea() {
  const { auth } = useAuth();

  if (auth.status === "loading") {
    return <Loader2 className="w-4 h-4 text-white/20 animate-spin" />;
  }

  if (auth.status === "authenticated") {
    return <ProfileDropdown />;
  }

  if (auth.status === "error") {
    return (
      <span className="text-[10px] text-red-400/70 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded-lg">
        Profil yüklenemedi
      </span>
    );
  }

  return <SignInButton />;
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { auth, logout } = useAuth();
  const { t } = useSettings();
  const router = useRouter();

  const NAV_LINKS = [
    { href: "/",            key: "nav.home"        },
    { href: "/leaderboard", key: "nav.leaderboard" },
    { href: "/devlog",      key: "nav.devlog"      },
    { href: "/about",       key: "nav.about"       },
    { href: "/contact",     key: "nav.contact"     },
  ];

  const isAuth = auth.status === "authenticated";
  const session = isAuth ? auth.session : null;
  const profileHref = session?.gameName && session?.tagLine
    ? `/player/${encodeURIComponent(session.gameName)}/${encodeURIComponent(session.tagLine)}`
    : null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/5"
      style={{ background: "rgba(15,25,35,0.80)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 bg-[#FF4655] rounded-lg flex items-center justify-center shadow-lg shadow-[#FF4655]/30 group-hover:shadow-[#FF4655]/50 transition-shadow">
            <Crosshair className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-black tracking-tight text-lg">
            KediPotter<span className="text-[#FF4655]">Tracker</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden sm:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, key }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "text-[#FF4655] bg-[#FF4655]/10" : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop sağ alan */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-emerald-400/90 font-semibold tracking-wide uppercase border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            Riot-compliant
          </span>
          <AuthArea />
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-white/40 hover:text-white transition-colors p-1"
          onClick={() => setOpen(o => !o)}
          aria-label="Menüyü aç/kapat"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menü */}
      {open && (
        <div className="sm:hidden border-t border-white/5 px-4 py-3 space-y-1" style={{ background: "rgba(15,25,35,0.95)" }}>
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === href ? "text-[#FF4655] bg-[#FF4655]/10" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {t(key)}
            </Link>
          ))}

          <div className="pt-2 border-t border-white/5 mt-2 space-y-2">
            {isAuth && session ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="relative flex-shrink-0">
                    {session.cardUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.cardUrl} alt={session.gameName ?? ""} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#FF4655]/15 border border-[#FF4655]/25 flex items-center justify-center">
                        <span className="text-[#FF4655] text-sm font-black">
                          {session.gameName?.slice(0, 2).toUpperCase() ?? "??"}
                        </span>
                      </div>
                    )}
                    {session.level > 0 && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FF4655] text-white text-[8px] font-black px-1 rounded-full">
                        {session.level}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{session.gameName}</p>
                    {session.tagLine && <p className="text-white/30 text-xs">#{session.tagLine}</p>}
                    {session.rankIcon && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={session.rankIcon} alt={session.rankName} className="w-3.5 h-3.5" />
                        <span className="text-white/40 text-[10px]">{session.rankName}</span>
                      </div>
                    )}
                  </div>
                </div>
                {profileHref && (
                  <Link href="/stats/me" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm">
                    <BarChart2 className="w-4 h-4 text-[#FF4655]" /> {t("nav.mystats")}
                  </Link>
                )}
                <Link href="/settings" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm">
                  <Settings className="w-4 h-4 text-white/40" /> Ayarlar
                </Link>
                <button
                  onClick={async () => { setOpen(false); await logout(); router.push("/"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.06] text-sm"
                >
                  <LogOut className="w-4 h-4" /> Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] text-emerald-400/90 font-semibold uppercase tracking-wide px-3">Riot-compliant app</p>
                <button
                  onClick={() => { setOpen(false); window.location.href = "/api/auth/riot/login"; }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#FF4655]/30 bg-[#FF4655]/5 text-[#FF4655] text-sm font-semibold w-full"
                >
                  <RiotLogo />
                  {t("nav.signin")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
