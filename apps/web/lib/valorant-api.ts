import axios, { AxiosError } from "axios";

const BASE = "https://api.henrikdev.xyz/valorant";
const KEY = process.env.HENRIK_API_KEY || "";

// Simple in-memory cache (server-side, 10 min TTL)
const _cache = new Map<string, { data: unknown; exp: number }>();

async function hGet(path: string) {
  const cached = _cache.get(path);
  if (cached && cached.exp > Date.now()) return cached.data;

  const res = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: KEY },
    timeout: 15000,
  });

  _cache.set(path, { data: res.data, exp: Date.now() + 10 * 60 * 1000 });
  return res.data;
}

export async function getAccount(name: string, tag: string) {
  const n = encodeURIComponent(name);
  const t = encodeURIComponent(tag);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await hGet(`/v1/account/${n}/${t}`) as any;
  const d = res.data;
  return {
    puuid: d.puuid as string,
    name: d.name as string,
    tag: d.tag as string,
    level: (d.account_level ?? 0) as number,
    region: (d.region ?? "eu") as string,
    card: (d.card ?? { small: "", large: "", wide: "" }) as {
      small: string; large: string; wide: string;
    },
  };
}

export async function getRank(name: string, tag: string, region: string) {
  const n = encodeURIComponent(name);
  const t = encodeURIComponent(tag);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await hGet(`/v2/mmr/${region}/${n}/${t}`) as any;
  return res.data;
}

export async function getMatches(name: string, tag: string, region: string, count = 10) {
  const n = encodeURIComponent(name);
  const t = encodeURIComponent(tag);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await hGet(`/v3/matches/${region}/${n}/${t}?size=${count}`) as any;
  return (res.data ?? []) as unknown[];
}

export async function getMatch(matchId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await hGet(`/v2/match/${matchId}`) as any;
  return res.data;
}

export function parseApiError(err: unknown): { message: string; status: number } {
  const e = err as AxiosError<{ message?: string }>;
  const status = e.response?.status ?? 500;
  if (status === 404) return { message: "Oyuncu bulunamadı. Nick#Tag formatını kontrol edin.", status: 404 };
  if (status === 429) return { message: "API rate limit aşıldı. 1 dakika bekleyin.", status: 429 };
  if (status === 403) return { message: "API erişim hatası.", status: 403 };
  return { message: "Sunucu hatası. Lütfen tekrar deneyin.", status: 500 };
}
