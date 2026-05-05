/** UTC calendar helpers for inventory expiry display (matches server DATEONLY semantics). */

export function addUtcDaysFromToday(days: number): string {
  const n = Math.floor(Number(days));
  if (!Number.isFinite(n) || n < 0) {
    return '';
  }
  const now = new Date();
  const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + n);
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Earliest expiry among lots with quantity &gt; 0. */
export function earliestOpenLotExpiry(lots: unknown): string | null {
  if (!Array.isArray(lots)) {
    return null;
  }
  const open = lots.filter((l: { quantity?: unknown }) => Number(l?.quantity) > 0);
  if (!open.length) {
    return null;
  }
  open.sort((a: { expiryDate?: unknown }, b: { expiryDate?: unknown }) =>
    String(a?.expiryDate ?? '').localeCompare(String(b?.expiryDate ?? ''))
  );
  const x = open[0]?.expiryDate;
  return x != null && String(x).trim() !== '' ? String(x) : null;
}

/** Whole days from today (UTC) to dateStr (YYYY-MM-DD); negative = past. */
export function daysFromTodayUtc(dateStr: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr).trim());
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const target = Date.UTC(y, mo, d);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}
