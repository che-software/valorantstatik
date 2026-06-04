// DevlogManager — JSON tabanlı devlog içerik yönetim servisi
// content/devlog/*.json dosyalarını okur, doğrular ve sıralar.
// Geçersiz dosyalar sessizce atlanır; asla exception fırlatmaz.
import fs from "fs";
import path from "path";
import { cacheManagerGet, cacheManagerSet, TTL_TABLE } from "@/lib/cache/cache-manager";

export interface DevlogItem {
  text:   string;
  status: "done" | "progress" | "planned";
}

export interface DevlogEntry {
  version:   string;
  date:      string;
  title:     string;
  category:  "api" | "ui" | "security" | "performance";
  items:     DevlogItem[];
  published?: boolean;
}

const DEVLOG_DIR  = path.join(process.cwd(), "content", "devlog");
const CACHE_KEY   = "devlog:list";
const SEMVER_RE   = /^v\d+\.\d+\.\d+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/**
 * Bir devlog girişinin geçerli olup olmadığını doğrular.
 * Zorunlu alanlar: version (vX.Y.Z), date (ISO 8601), title, category, items.
 */
export function validateEntry(raw: unknown): raw is DevlogEntry {
  if (!raw || typeof raw !== "object") return false;
  const e = raw as Record<string, unknown>;

  if (typeof e.version !== "string" || !SEMVER_RE.test(e.version)) return false;
  if (typeof e.date    !== "string" || !ISO_DATE_RE.test(e.date))   return false;
  if (typeof e.title   !== "string" || !e.title.trim())             return false;
  if (!["api", "ui", "security", "performance"].includes(e.category as string)) return false;
  if (!Array.isArray(e.items) || e.items.length === 0)              return false;

  return true;
}

/**
 * content/devlog/ dizinindeki tüm JSON dosyalarını okur.
 * Geçersiz dosyalar atlanır. Sonuç date'e göre azalan sırada döner.
 * 1 saat TTL ile önbelleklenir.
 */
export async function getEntries(): Promise<DevlogEntry[]> {
  // Dev ortamında cache'i atla — her istekte taze oku
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    const cached = await cacheManagerGet<DevlogEntry[]>(CACHE_KEY);
    if (cached) return cached;
  }

  const entries: DevlogEntry[] = [];

  try {
    if (!fs.existsSync(DEVLOG_DIR)) return [];

    const files = fs.readdirSync(DEVLOG_DIR).filter(f => f.endsWith(".json"));

    for (const file of files) {
      try {
        const raw  = fs.readFileSync(path.join(DEVLOG_DIR, file), "utf-8");
        const data = JSON.parse(raw) as unknown;

        if (!validateEntry(data)) {
          console.warn(`[DevlogManager] Geçersiz giriş atlandı: ${file}`);
          continue;
        }

        // published: false ise gösterme
        if ((data as DevlogEntry).published === false) continue;

        entries.push(data as DevlogEntry);
      } catch {
        console.warn(`[DevlogManager] Dosya okunamadı: ${file}`);
      }
    }
  } catch {
    // Dizin yoksa veya okunamazsa boş dizi döner
    return [];
  }

  // Tarihe göre azalan sıralama (en yeni önce)
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  await cacheManagerSet(CACHE_KEY, entries, TTL_TABLE.devlog);
  return entries;
}
