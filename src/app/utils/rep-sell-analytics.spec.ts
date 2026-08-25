import {
  parseSellDate,
  getSellLineTotal,
  startOfDay,
  endOfDay,
  toInputDateValue,
  parseInputDateValue,
  eachDayKeyInRange,
  filterSellsByDateRange,
  sumSellTotals,
  buildDailySeries,
  buildMonthlySeries,
  monthKey,
} from './rep-sell-analytics';

describe('rep-sell-analytics utils', () => {
  describe('parseSellDate', () => {
    it('parses createdDate from sell', () => {
      const d = parseSellDate({ createdDate: '2026-01-15T10:00:00Z' });
      expect(d).toBeTruthy();
      expect(d!.getFullYear()).toBe(2026);
    });

    it('falls back to order.createdDate', () => {
      const d = parseSellDate({ order: { createdDate: '2026-06-01T12:00:00Z' } });
      expect(d).toBeTruthy();
      expect(d!.getMonth()).toBe(5);
    });

    it('returns null for missing date', () => {
      expect(parseSellDate({})).toBeNull();
      expect(parseSellDate(null)).toBeNull();
    });

    it('returns null for invalid date', () => {
      expect(parseSellDate({ createdDate: 'not-a-date' })).toBeNull();
    });
  });

  describe('getSellLineTotal', () => {
    it('uses totalPrice when available', () => {
      expect(getSellLineTotal({ totalPrice: 20 })).toBe(20);
    });

    it('calculates from quantity * price when no totalPrice', () => {
      expect(getSellLineTotal({ quantity: 3, price: 10 })).toBe(30);
    });

    it('returns 0 for missing data', () => {
      expect(getSellLineTotal({})).toBe(0);
    });
  });

  describe('startOfDay / endOfDay', () => {
    it('startOfDay sets time to 00:00:00', () => {
      const d = startOfDay(new Date(2026, 0, 15, 14, 30, 0));
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    });

    it('endOfDay sets time to 23:59:59', () => {
      const d = endOfDay(new Date(2026, 0, 15, 14, 30, 0));
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(59);
      expect(d.getSeconds()).toBe(59);
    });
  });

  describe('toInputDateValue / parseInputDateValue', () => {
    it('roundtrips a date', () => {
      const d = new Date(2026, 5, 15);
      const s = toInputDateValue(d);
      expect(s).toBe('2026-06-15');
      const parsed = parseInputDateValue(s);
      expect(parsed!.getFullYear()).toBe(2026);
      expect(parsed!.getMonth()).toBe(5);
      expect(parsed!.getDate()).toBe(15);
    });

    it('returns null for invalid string', () => {
      expect(parseInputDateValue('')).toBeNull();
      expect(parseInputDateValue('not-a-date')).toBeNull();
    });
  });

  describe('eachDayKeyInRange', () => {
    it('returns correct range of days', () => {
      const from = new Date(2026, 0, 1);
      const to = new Date(2026, 0, 3);
      const keys = eachDayKeyInRange(from, to);
      expect(keys).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    });

    it('returns empty array when end before start', () => {
      const from = new Date(2026, 0, 5);
      const to = new Date(2026, 0, 1);
      expect(eachDayKeyInRange(from, to)).toEqual([]);
    });

    it('returns single day for same date', () => {
      const d = new Date(2026, 5, 15);
      expect(eachDayKeyInRange(d, d)).toEqual(['2026-06-15']);
    });
  });

  describe('filterSellsByDateRange', () => {
    it('filters sells within date range', () => {
      const sells = [
        { createdDate: '2026-01-10T12:00:00Z' },
        { createdDate: '2026-01-15T12:00:00Z' },
        { createdDate: '2026-01-20T12:00:00Z' },
      ];
      const result = filterSellsByDateRange(sells, new Date(2026, 0, 12), new Date(2026, 0, 18));
      expect(result.length).toBe(1);
    });

    it('excludes sells outside range', () => {
      const sells = [{ createdDate: '2026-01-01T12:00:00Z' }];
      const result = filterSellsByDateRange(sells, new Date(2026, 0, 5), new Date(2026, 0, 10));
      expect(result.length).toBe(0);
    });
  });

  describe('sumSellTotals', () => {
    it('sums total prices', () => {
      const sells = [{ totalPrice: 10 }, { totalPrice: 20 }, { totalPrice: 5 }];
      expect(sumSellTotals(sells)).toBe(35);
    });

    it('returns 0 for empty array', () => {
      expect(sumSellTotals([])).toBe(0);
    });
  });

  describe('buildDailySeries', () => {
    it('builds daily totals', () => {
      const from = new Date(2026, 0, 1);
      const to = new Date(2026, 0, 3);
      const sells = [
        { createdDate: '2026-01-01T12:00:00Z', totalPrice: 10 },
        { createdDate: '2026-01-01T14:00:00Z', totalPrice: 5 },
        { createdDate: '2026-01-03T12:00:00Z', totalPrice: 20 },
      ];
      const series = buildDailySeries(sells, from, to);
      expect(series.dayKeys).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
      expect(series.values).toEqual([15, 0, 20]);
    });
  });

  describe('buildMonthlySeries', () => {
    it('builds monthly totals', () => {
      const sells = [
        { createdDate: '2026-01-10T12:00:00Z', totalPrice: 10 },
        { createdDate: '2026-01-20T12:00:00Z', totalPrice: 20 },
        { createdDate: '2026-02-05T12:00:00Z', totalPrice: 30 },
      ];
      const series = buildMonthlySeries(sells);
      expect(series.monthKeys).toEqual(['2026-01', '2026-02']);
      expect(series.values).toEqual([30, 30]);
    });
  });

  describe('monthKey', () => {
    it('generates YYYY-MM key', () => {
      expect(monthKey(new Date(2026, 0, 1))).toBe('2026-01');
      expect(monthKey(new Date(2026, 11, 25))).toBe('2026-12');
    });
  });
});
