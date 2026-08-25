import {
  addUtcDaysFromToday,
  earliestOpenLotExpiry,
  daysFromTodayUtc,
} from './inv-expiry';

describe('inv-expiry utils', () => {
  describe('addUtcDaysFromToday', () => {
    it('returns a YYYY-MM-DD string for 0 days', () => {
      const result = addUtcDaysFromToday(0);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('adds days correctly', () => {
      const result = addUtcDaysFromToday(7);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const d = new Date();
      const expected = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7));
      const expectedStr = `${expected.getUTCFullYear()}-${String(expected.getUTCMonth() + 1).padStart(2, '0')}-${String(expected.getUTCDate()).padStart(2, '0')}`;
      expect(result).toBe(expectedStr);
    });

    it('returns empty string for negative days', () => {
      expect(addUtcDaysFromToday(-1)).toBe('');
    });

    it('returns empty string for NaN', () => {
      expect(addUtcDaysFromToday(NaN)).toBe('');
    });

    it('floors fractional days', () => {
      const result = addUtcDaysFromToday(2.9);
      const result2 = addUtcDaysFromToday(2);
      expect(result).toBe(result2);
    });
  });

  describe('earliestOpenLotExpiry', () => {
    it('returns null for non-array input', () => {
      expect(earliestOpenLotExpiry(null)).toBeNull();
      expect(earliestOpenLotExpiry(undefined)).toBeNull();
      expect(earliestOpenLotExpiry('string')).toBeNull();
    });

    it('returns null for empty array', () => {
      expect(earliestOpenLotExpiry([])).toBeNull();
    });

    it('returns null when all lots have quantity 0', () => {
      const lots = [
        { expiryDate: '2026-01-01', quantity: 0 },
        { expiryDate: '2026-02-01', quantity: 0 },
      ];
      expect(earliestOpenLotExpiry(lots)).toBeNull();
    });

    it('returns earliest expiry among lots with quantity > 0', () => {
      const lots = [
        { expiryDate: '2026-03-01', quantity: 5 },
        { expiryDate: '2026-01-15', quantity: 3 },
        { expiryDate: '2026-06-01', quantity: 1 },
      ];
      expect(earliestOpenLotExpiry(lots)).toBe('2026-01-15');
    });

    it('ignores lots with quantity 0', () => {
      const lots = [
        { expiryDate: '2025-01-01', quantity: 0 },
        { expiryDate: '2026-06-01', quantity: 1 },
      ];
      expect(earliestOpenLotExpiry(lots)).toBe('2026-06-01');
    });

    it('returns null when open lot has no expiryDate', () => {
      const lots = [{ quantity: 5 }];
      expect(earliestOpenLotExpiry(lots)).toBeNull();
    });
  });

  describe('daysFromTodayUtc', () => {
    it('returns null for invalid format', () => {
      expect(daysFromTodayUtc('not-a-date')).toBeNull();
      expect(daysFromTodayUtc('')).toBeNull();
      expect(daysFromTodayUtc('2026/01/01')).toBeNull();
    });

    it('returns a number for valid date', () => {
      const result = daysFromTodayUtc('2026-12-31');
      expect(typeof result).toBe('number');
      expect(Number.isFinite(result)).toBe(true);
    });

    it('returns positive for future date', () => {
      const now = new Date();
      const future = `${now.getUTCFullYear() + 1}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      expect(daysFromTodayUtc(future)).toBeGreaterThan(0);
    });

    it('returns 0 for today', () => {
      const now = new Date();
      const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      expect(daysFromTodayUtc(today)).toBe(0);
    });
  });
});
