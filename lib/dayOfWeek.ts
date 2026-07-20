export const DAY_LABELS = ["月", "火", "水", "木", "金"];

// JS Date#getDay(): 0=日 ... 6=土 → 0=月 ... 6=日 に変換
export function dayOfWeekFromDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  return (jsDay + 6) % 7;
}
