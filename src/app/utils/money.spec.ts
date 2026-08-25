import { roundToCents, orderAmountDue, isOrderReadyToSubmit } from './money';

describe('money utils', () => {
  describe('roundToCents', () => {
    it('rounds to two decimal places', () => {
      expect(roundToCents(10.005)).toBe(10.01);
      expect(roundToCents(10.004)).toBe(10.00);
    });

    it('handles exact integers', () => {
      expect(roundToCents(10)).toBe(10);
      expect(roundToCents(0)).toBe(0);
    });

    it('handles negative values', () => {
      expect(roundToCents(-10.006)).toBe(-10.01);
      expect(roundToCents(-10.004)).toBe(-10.00);
    });

    it('handles string input', () => {
      expect(roundToCents('10.555')).toBe(10.56);
      expect(roundToCents('abc')).toBe(0);
    });

    it('handles null/undefined/empty', () => {
      expect(roundToCents(null)).toBe(0);
      expect(roundToCents(undefined)).toBe(0);
      expect(roundToCents('')).toBe(0);
    });

    it('handles Infinity and NaN', () => {
      expect(roundToCents(Infinity)).toBe(0);
      expect(roundToCents(NaN)).toBe(0);
    });

    it('handles floating-point precision issues (0.1 + 0.2)', () => {
      const result = roundToCents(0.1 + 0.2);
      expect(result).toBe(0.3);
    });

    it('rounds typical Bolivianos amounts correctly', () => {
      expect(roundToCents(32.675)).toBe(32.67);
      expect(roundToCents(15.995)).toBe(16.00);
      expect(roundToCents(8.494)).toBe(8.49);
      expect(roundToCents(32.68)).toBe(32.68);
    });

    it('handles large amounts', () => {
      expect(roundToCents(999999.995)).toBe(1000000.00);
      expect(roundToCents(1000000.00)).toBe(1000000.00);
    });

    it('preserves cents precision', () => {
      expect(roundToCents(1.01)).toBe(1.01);
      expect(roundToCents(1.10)).toBe(1.10);
      expect(roundToCents(1.99)).toBe(1.99);
    });
  });

  describe('orderAmountDue', () => {
    it('returns full total when no payments or discounts', () => {
      expect(orderAmountDue(100, 0, 0, 0)).toBe(100);
    });

    it('returns 0 when fully paid', () => {
      expect(orderAmountDue(100, 100, 0, 0)).toBe(0);
    });

    it('accounts for discount', () => {
      expect(orderAmountDue(100, 0, 0, 10)).toBe(90);
    });

    it('accounts for change/return lines', () => {
      expect(orderAmountDue(100, 110, 10, 0)).toBe(0);
    });

    it('computes net due with all factors', () => {
      expect(orderAmountDue(100, 80, 5, 10)).toBe(15);
    });

    it('returns 0 when overpaid (no negative due)', () => {
      expect(orderAmountDue(100, 200, 0, 0)).toBe(0);
    });

    it('returns 0 for zero total', () => {
      expect(orderAmountDue(0, 0, 0, 0)).toBe(0);
    });

    it('handles null/undefined inputs gracefully', () => {
      expect(orderAmountDue(null as any, null as any, null as any, null as any)).toBe(0);
      expect(orderAmountDue(undefined as any, undefined as any, undefined as any, undefined as any)).toBe(0);
    });

    it('handles discount larger than total (floors at 0)', () => {
      expect(orderAmountDue(10, 0, 0, 50)).toBe(0);
    });

    it('rounds intermediate calculations', () => {
      expect(orderAmountDue(33.33, 22.22, 0, 0)).toBe(11.11);
    });
  });

  describe('isOrderReadyToSubmit', () => {
    it('returns true when total > 0 and fully paid', () => {
      expect(isOrderReadyToSubmit(100, 100, 0, 0, 0)).toBe(true);
    });

    it('returns false when total is 0', () => {
      expect(isOrderReadyToSubmit(0, 0, 0, 0, 0)).toBe(false);
    });

    it('returns false when not fully paid', () => {
      expect(isOrderReadyToSubmit(100, 50, 0, 0, 0)).toBe(false);
    });

    it('returns false when print is locked', () => {
      expect(isOrderReadyToSubmit(100, 100, 0, 0, 1)).toBe(false);
    });

    it('returns false when printOrderCount is null', () => {
      expect(isOrderReadyToSubmit(100, 100, 0, 0, null)).toBe(true);
    });

    it('returns false when printOrderCount is undefined', () => {
      expect(isOrderReadyToSubmit(100, 100, 0, 0, undefined)).toBe(true);
    });

    it('returns true when discount covers total', () => {
      expect(isOrderReadyToSubmit(100, 0, 0, 100, 0)).toBe(true);
    });

    it('returns true when overpaid', () => {
      expect(isOrderReadyToSubmit(100, 150, 0, 0, 0)).toBe(true);
    });

    it('handles null/undefined total gracefully', () => {
      expect(isOrderReadyToSubmit(null as any, 0, 0, 0, 0)).toBe(false);
    });
  });
});
