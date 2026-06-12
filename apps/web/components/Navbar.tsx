"use client";
/**
 * @file Navbar.tsx
 * @description Top navigation bar — sticky, frosted-glass, Che Tracker branding.
 *
 * Includes:
 *  - Animated Riot SSO sign-in button with hover glow
 *  - Authenticated profile dropdown (avatar, rank, quick links)
 *  - Responsive mobile drawer
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, X, ChevronDown, BarChart2,
  Settings, LogOut, Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth }     from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import DonateButton from "./DonateButton";

// ── Riot logo SVG ─────────────────────────────────────────────────────────────
function RiotLogo({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.534 21.77l-1.09-2.81-4.431 1.108L5.12 24l7.414-2.23zM2.287 16.96L0 24l3.995-1.02-.974-2.51 5.148-1.287-.687-1.773-5.195 1.55zM21.713 0L7.508 4.56l.996 2.57 9.435-2.83.687 1.772-9.388 2.81 1.03 2.656 9.342-2.8.687 1.772-9.295 2.787 1.03 2.656 9.248-2.773.688 1.772-9.202 2.76 1.03 2.656L24 16.96 21.713 0z" />
    </svg>
  );
}

// ── Che-Software wordmark logo ────────────────────────────────────────────────
function CheTrackerLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
      {/* Icon mark */}
      <div className="w-8 h-8 rounded-lg bg-[#FF4655] flex items-center justify-center
                      shadow-lg shadow-[#FF4655]/30
                      group-hover:shadow-[#FF4655]/55 group-hover:scale-105 transition-all">
        {/* Custom chevron-target icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </div>

      {/* Wordmark */}
      <span className="text-white font-black tracking-tight text-[17px] leading-none">
        Che<span className="text-[#FF4655]">Tracker</span>
      </span>
    </Link>
  );
}

// ── Profile dropdown (authenticated) ─────────────────────────────────────────
function ProfileDropdown() {
  const { auth, logout } = useAuth();
  const router           = useRouter();
  const { t }            = useSettings();
  const [open, setOpen]  = useState(false);
  const ref              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (auth.status !== "authenticated") return null;

  const { gameName, tagLine, level, cardUrl, rankName, rankIcon, rr } = auth.session;
  const initials = gameName?.slice(0, 2).toUpperCase() ?? "??";

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                   border border-white/[0.09] bg-white/[0.04]
                   hover:bg-white/[0.08] hover:border-white/[0.15]
                   transition-all"
      >
        {/* Avatar */}
        <div className="relative w-7 h-7 flex-shrink-0">
          {cardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardUrl} alt={gameName ?? ""} className="w-7 h-7 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[#FF4655]/15 border border-[#FF4655]/25
                            flex items-center justify-center">
              <span className="text-[#FF4655] text-[10px] font-black">{initials}</span>
            </div>
          )}
          {level > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-[#FF4655] text-white
                             text-[8px] font-black px-1 rounded-full leading-tight">
              {level}
            </span>
          )}
        </div>

        <span className="text-white/75 text-xs font-semibold max-w-[100px] truncate hidden sm:block">
          {gameName ?? "Riot Account"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden z-50
                     border border-white/[0.08]"
          style={{
            background:    "rgba(10,14,20,0.97)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Profile header */}
          <div className="px-4 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {cardUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cardUrl} alt={gameName ?? ""} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#FF4655]/12 border border-[#FF4655]/20
                                  flex items-center justify-center">
                    <span className="text-[#FF4655] text-lg font-black">{initials}</span>
                  </div>
                )}
                {level > 0 && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2
                                   bg-[#FF4655] text-white text-[9px] font-black
                                   px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                    Lv {level}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-bold truncate">{gameName}</p>
                {tagLine && <p className="text-white/30 text-xs">#{tagLine}</p>}
                {rankIcon && (
                  <div className="flex items-center gap-1 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rankIcon} alt={rankName} className="w-4 h-4" />
                    <span className="text-white/50 text-[11px]">{rankName}</span>
                    {rr > 0 && <span className="text-white/25 text-[11px]">· {rr} RR</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <Link href="/stats/me" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5
                         text-white/55 hover:text-white hover:bg-white/[0.05]
                         transition-colors text-sm">
              <BarChart2 className="w-4 h-4 text-[#FF4655]" />
              {t("nav.mystats")}
            </Link>
            <Link href="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5
                         text-white/55 hover:text-white hover:bg-white/[0.05]
                         transition-colors text-sm">
              <Settings className="w-4 h-4 text-white/35" />
              {t("nav.settings")}
            </Link>
          </div>

          <div className="border-t border-white/[0.06] py-1.5">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5
                         text-rose-400/75 hover:text-rose-400 hover:bg-rose-500/[0.06]
                         transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sign-in button with Riot glow effect ──────────────────────────────────────
function SignInButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  const { t } = useSettings();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    onClick?.();
    window.location.href = "/api/auth/riot/login";
  }

  const base =
    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs " +
    "border border-[#FF4655]/30 bg-[#FF4655]/8 text-[#FF4655] " +
    "hover:bg-[#FF4655]/15 hover:border-[#FF4655]/55 hover:shadow-lg hover:shadow-[#FF4655]/20 " +
    "transition-all";

  return (
    <button onClick={handleClick} className={className ?? `hidden sm:inline-flex ${base}`}>
      <RiotLogo />
      <span>{t("nav.signin")}</span>
    </button>
  );
}

// ── Auth area — adapts to loading / unauth / auth state ──────────────────────
function AuthArea() {
  const { auth } = useAuth();

  if (auth.status === "loading") {
    return <Loader2 className="w-4 h-4 text-white/20 animate-spin" />;
  }
  if (auth.status === "authenticated") return <ProfileDropdown />;
  if (auth.status === "error") {
    return (
      <span className="text-[10px] text-rose-400/70 border border-rose-500/20 bg-rose-500/5 px-2 py-1 rounded-lg">
        Profile unavailable
      </span>
    );
  }
  return <SignInButton />;
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname       = usePathname();
  const router         = useRouter();
  const { auth, logout } = useAuth();
  const { t }          = useSettings();
  const [open, setOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/",            key: "nav.home"        },
    { href: "/leaderboard", key: "nav.leaderboard" },
    { href: "/devlog",      key: "nav.devlog"      },
    { href: "/about",       key: "nav.about"       },
    { href: "/contact",     key: "nav.contact"     },
  ];

  const isAuth  = auth.status === "authenticated";
  const session = isAuth ? auth.session : null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/[0.05]"
      style={{
        background:             "rgba(13,17,23,0.82)",
        backdropFilter:          "blur(20px)",
        WebkitBackdropFilter:    "blur(20px)",
      }}
    >
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Logo */}
        <CheTrackerLogo />

        {/* Desktop links */}
        <ul className="hidden sm:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, key }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "text-[#FF4655] bg-[#FF4655]/10"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop right */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <DonateButton />
          <span className="text-[10px] text-emerald-400/80 font-semibold tracking-wide uppercase
                           border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 rounded-md">
            Riot-compliant
          </span>
          <AuthArea />
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div
          className="sm:hidden border-t border-white/[0.05] px-4 py-3 space-y-1"
          style={{ background: "rgba(10,14,20,0.97)" }}
        >
          {NAV_LINKS.map(({ href, key }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === href
                  ? "text-[#FF4655] bg-[#FF4655]/10"
                  : "text-white/40 hover:text-white hover:bg-white/[0.05]"
              }`}>
              {t(key)}
            </Link>
          ))}

          <div className="pt-2 border-t border-white/[0.05] mt-2 space-y-2">
            {isAuth && session ? (
              <>
                {/* Compact profile row */}
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="relative flex-shrink-0">
                    {session.cardUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.cardUrl} alt={session.gameName ?? ""} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#FF4655]/12 border border-[#FF4655]/20 flex items-center justify-center">
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

                <Link href="/stats/me" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.05] text-sm">
                  <BarChart2 className="w-4 h-4 text-[#FF4655]" />
                  {t("nav.mystats")}
                </Link>
                <Link href="/settings" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/[0.05] text-sm">
                  <Settings className="w-4 h-4 text-white/35" />
                  Settings
                </Link>
                <button
                  onClick={async () => { setOpen(false); await logout(); router.push("/"); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-400/75 hover:text-rose-400 hover:bg-rose-500/[0.06] text-sm">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
                <div className="pt-2 flex justify-center">
                  <DonateButton />
                </div>
              </>
            ) : (
              <>
                <p className="text-[10px] text-emerald-400/80 font-semibold uppercase tracking-wide px-3 pb-1">
                  Riot-compliant app
                </p>
                <button
                  onClick={() => { setOpen(false); window.location.href = "/api/auth/riot/login"; }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl w-full
                             border border-[#FF4655]/30 bg-[#FF4655]/8 text-[#FF4655] text-sm font-semibold
                             hover:bg-[#FF4655]/15 hover:border-[#FF4655]/50 transition-all"
                >
                  <RiotLogo size={15} />
                  {t("nav.signin")}
                </button>
                <div className="pt-3 pb-1 flex justify-center border-t border-white/[0.05] mt-2">
                  <DonateButton />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
