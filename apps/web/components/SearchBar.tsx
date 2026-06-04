"use client";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Crosshair, Clock, X, Trash2 } from "lucide-react";
import {
  loadHistory, addToHistory, removeFromHistory, clearHistory, timeAgo,
  type HistoryEntry,
} from "@/lib/search-history";

export default function SearchBar() {
  const [query,   setQuery]   = useState("");
  const [error,   setError]   = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const router  = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Geçmişi yükle
  useEffect(() => {
    setHistory(loadHistory());
  }, [focused]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function navigate(name: string, tag: string) {
    addToHistory(name, tag);
    setLoading(true);
    setFocused(false);
    setTimeout(() => {
      router.push(`/player/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
    }, 400);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parts = query.trim().split("#");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("RiotID#TAG formatında girin · örn: TenZ#0000");
      return;
    }
    navigate(parts[0], parts[1]);
  }

  function handleRemove(e: React.MouseEvent, name: string, tag: string) {
    e.stopPropagation();
    removeFromHistory(name, tag);
    setHistory(loadHistory());
  }

  function handleClearAll(e: React.MouseEvent) {
    e.stopPropagation();
    clearHistory();
    setHistory([]);
  }

  const showDropdown = focused && history.length > 0 && !loading;

  return (
    <motion.div
      ref={wrapRef}
      className="w-full max-w-xl mx-auto relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Neon glow ring */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500"
            style={{
              boxShadow: focused
                ? "0 0 0 1px rgba(255,70,84,0.6), 0 0 40px rgba(255,70,84,0.25), 0 0 80px rgba(255,70,84,0.1)"
                : "none",
            }}
          />

          <div className={`relative flex items-center rounded-2xl border transition-all duration-300 overflow-hidden ${
            focused ? "border-[#FF4655]/60 bg-white/8" : "border-white/10 bg-white/5"
          }`}>
            <div className="pl-5 pr-2 flex-shrink-0">
              <Search className={`w-5 h-5 transition-colors duration-300 ${focused ? "text-[#FF4655]" : "text-white/30"}`} />
            </div>

            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="RiotID#TAG · örn: TenZ#0000"
              disabled={loading}
              className="flex-1 py-5 px-2 bg-transparent text-white placeholder-white/25 focus:outline-none text-base disabled:opacity-50"
            />

            {/* Temizle butonu */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-2 text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="m-2 px-6 py-3 bg-[#FF4655] hover:bg-[#e03545] text-white font-bold rounded-xl transition-colors text-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[90px] justify-center"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.span key="loading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                    <motion.span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full block" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }} />
                    <span>Aranıyor</span>
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4" />
                    Ara
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-[#FF4655] text-xs text-center">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* Arama geçmişi dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{
              background: "rgba(10,17,23,0.97)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Son Aramalar</span>
              </div>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-white/20 hover:text-red-400 text-xs transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Temizle
              </button>
            </div>

            {/* Geçmiş listesi */}
            <div className="py-1">
              {history.map(entry => (
                <div
                  key={`${entry.name}#${entry.tag}`}
                  onClick={() => navigate(entry.name, entry.tag)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] cursor-pointer group transition-colors"
                >
                  {/* İkon */}
                  <div className="w-7 h-7 rounded-lg bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center flex-shrink-0">
                    <Crosshair className="w-3.5 h-3.5 text-[#FF4655]/60" />
                  </div>

                  {/* İsim */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium group-hover:text-white transition-colors truncate">
                      {entry.name}
                      <span className="text-white/30 font-normal">#{entry.tag}</span>
                    </p>
                    <p className="text-white/20 text-[10px]">{timeAgo(entry.ts)}</p>
                  </div>

                  {/* Sil butonu */}
                  <button
                    onClick={e => handleRemove(e, entry.name, entry.tag)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
