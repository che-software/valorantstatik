// Arama geçmişi — localStorage tabanlı, SSR-safe
const HISTORY_KEY = "vt_search_history";
const MAX_HISTORY = 8;

export interface HistoryEntry {
  name: string;
  tag:  string;
  ts:   number;
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(name: string, tag: string) {
  const existing = loadHistory().filter(
    e => !(e.name.toLowerCase() === name.toLowerCase() && e.tag.toLowerCase() === tag.toLowerCase())
  );
  const updated = [{ name, tag, ts: Date.now() }, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function removeFromHistory(name: string, tag: string) {
  const updated = loadHistory().filter(
    e => !(e.name.toLowerCase() === name.toLowerCase() && e.tag.toLowerCase() === tag.toLowerCase())
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}g önce`;
  if (h > 0) return `${h}s önce`;
  if (m > 0) return `${m}dk önce`;
  return "az önce";
}
