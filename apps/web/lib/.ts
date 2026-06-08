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
