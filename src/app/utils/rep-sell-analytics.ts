import { roundToCents } from './money';

/** Parse line date from order detail (LoopBack includes optional `order`). */
export function parseSellDate(sell: any): Date | null {
  const raw = sell?.createdDate ?? sell?.order?.createdDate;
  if (raw == null || raw === '') {
    return null;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getSellLineTotal(sell: any): number {
  const tp = sell?.totalPrice;
  if (tp != null && Number.isFinite(Number(tp))) {
    return roundToCents(tp);
  }
  const q = Number(sell?.quantity ?? 0);
  const p = Number(sell?.price ?? 0);
  return roundToCents(q * p);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function toInputDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseInputDateValue(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return null;
  }
  const [y, mo, d] = s.split('-').map(Number);
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function addCalendarDays(d: Date, delta: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

export function toDayKey(d: Date): string {
  return toInputDateValue(d);
}

/** Inclusive calendar days from `from` to `to` (date-only). */
export function eachDayKeyInRange(from: Date, to: Date): string[] {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end < start) {
    return [];
  }
  const keys: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    keys.push(toDayKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

export function shortDayLabel(dayKey: string): string {
  const d = parseInputDateValue(dayKey);
  if (!d) {
    return dayKey;
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthKeyStr: string): string {
  const [y, m] = monthKeyStr.split('-').map(Number);
  if (!y || !m) {
    return monthKeyStr;
  }
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function filterSellsByDateRange(sells: any[], from: Date, to: Date): any[] {
  const lo = startOfDay(from);
  const hi = endOfDay(to);
  return sells.filter(s => {
    const dt = parseSellDate(s);
    return dt != null && dt >= lo && dt <= hi;
  });
}

export function sumSellTotals(sells: any[]): number {
  let t = 0;
  for (const s of sells) {
    t += getSellLineTotal(s);
  }
  return roundToCents(t);
}

export interface DaySeries {
  dayKeys: string[];
  labels: string[];
  values: number[];
}

export function buildDailySeries(sells: any[], from: Date, to: Date): DaySeries {
  const dayKeys = eachDayKeyInRange(from, to);
  const totals = new Map<string, number>(dayKeys.map(k => [k, 0]));
  for (const s of sells) {
    const dt = parseSellDate(s);
    if (!dt) {
      continue;
    }
    const k = toDayKey(startOfDay(dt));
    if (totals.has(k)) {
      totals.set(k, roundToCents((totals.get(k) ?? 0) + getSellLineTotal(s)));
    }
  }
  return {
    dayKeys,
    labels: dayKeys.map(shortDayLabel),
    values: dayKeys.map(k => totals.get(k) ?? 0),
  };
}

export interface MonthSeries {
  monthKeys: string[];
  labels: string[];
  values: number[];
}

/** One bar per calendar month present in the filtered lines (chronological). */
export function buildMonthlySeries(sells: any[]): MonthSeries {
  const map = new Map<string, number>();
  for (const s of sells) {
    const dt = parseSellDate(s);
    if (!dt) {
      continue;
    }
    const mk = monthKey(dt);
    map.set(mk, roundToCents((map.get(mk) ?? 0) + getSellLineTotal(s)));
  }
  const monthKeys = [...map.keys()].sort();
  return {
    monthKeys,
    labels: monthKeys.map(monthLabel),
    values: monthKeys.map(k => map.get(k) ?? 0),
  };
}
