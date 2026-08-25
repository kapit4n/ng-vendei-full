import {
  parseProductNum,
  mapProductsToSalesRows,
  sortRowsByRevenueDesc,
  buildExecutiveSummary,
  pickSlowMovers,
  sortRowsForTable,
} from './rep-product-sales-analytics';

describe('rep-product-sales-analytics utils', () => {
  describe('parseProductNum', () => {
    it('parses valid numbers', () => {
      expect(parseProductNum(42)).toBe(42);
      expect(parseProductNum('3.14')).toBe(3.14);
    });

    it('returns 0 for NaN', () => {
      expect(parseProductNum('abc')).toBe(0);
    });

    it('returns 0 for null/undefined', () => {
      expect(parseProductNum(null)).toBe(0);
      expect(parseProductNum(undefined)).toBe(0);
    });
  });

  describe('mapProductsToSalesRows', () => {
    it('maps raw products to analytics rows', () => {
      const raw = [
        { id: 1, name: 'Apple', code: 'A1', quantitySelled: 10, totalSelled: 100, stock: 50, cost: 5, price: 10 },
      ];
      const rows = mapProductsToSalesRows(raw);
      expect(rows.length).toBe(1);
      expect(rows[0].units).toBe(10);
      expect(rows[0].revenue).toBe(100);
      expect(rows[0].estGrossMargin).toBe(50); // 100 - 5*10
    });

    it('calculates share of revenue', () => {
      const raw = [
        { id: 1, totalSelled: 100 },
        { id: 2, totalSelled: 300 },
      ];
      const rows = mapProductsToSalesRows(raw);
      expect(rows[0].shareOfRevenuePct).toBe(25);
      expect(rows[1].shareOfRevenuePct).toBe(75);
    });

    it('skips entries without id', () => {
      const raw = [null, { name: 'No ID' }, { id: 1 }];
      expect(mapProductsToSalesRows(raw).length).toBe(1);
    });

    it('returns empty for empty input', () => {
      expect(mapProductsToSalesRows([])).toEqual([]);
    });

    it('calculates average unit price', () => {
      const raw = [{ id: 1, quantitySelled: 5, totalSelled: 50 }];
      const rows = mapProductsToSalesRows(raw);
      expect(rows[0].avgUnitPrice).toBe(10);
    });
  });

  describe('sortRowsByRevenueDesc', () => {
    it('sorts by revenue descending', () => {
      const rows = [
        { revenue: 10 } as any,
        { revenue: 30 } as any,
        { revenue: 20 } as any,
      ];
      const sorted = sortRowsByRevenueDesc(rows);
      expect(sorted.map(r => r.revenue)).toEqual([30, 20, 10]);
    });
  });

  describe('buildExecutiveSummary', () => {
    it('builds correct summary', () => {
      const rows = [
        { units: 10, revenue: 100, estGrossMargin: 50, stock: 20, cost: 5, price: 10, id: '1', name: 'A', code: 'A', shareOfRevenuePct: 0, avgUnitPrice: 10 },
        { units: 5, revenue: 50, estGrossMargin: 25, stock: 10, cost: 5, price: 10, id: '2', name: 'B', code: 'B', shareOfRevenuePct: 0, avgUnitPrice: 10 },
      ];
      const byRev = sortRowsByRevenueDesc(rows);
      const summary = buildExecutiveSummary(rows, byRev);
      expect(summary.totalRevenue).toBe(150);
      expect(summary.totalUnits).toBe(15);
      expect(summary.skuCount).toBe(2);
      expect(summary.pareto80Count).toBe(1);
    });
  });

  describe('pickSlowMovers', () => {
    it('returns products with stock but no sales', () => {
      const rows = [
        { stock: 10, revenue: 0, units: 0 } as any,
        { stock: 5, revenue: 100, units: 10 } as any,
        { stock: 20, revenue: 0, units: 0 } as any,
      ];
      const slow = pickSlowMovers(rows, 10);
      expect(slow.length).toBe(2);
      expect(slow[0].stock).toBe(20);
    });

    it('respects limit', () => {
      const rows = [
        { stock: 10, revenue: 0, units: 0 } as any,
        { stock: 20, revenue: 0, units: 0 } as any,
      ];
      expect(pickSlowMovers(rows, 1).length).toBe(1);
    });
  });

  describe('sortRowsForTable', () => {
    const rows = [
      { revenue: 100, units: 5, estGrossMargin: 50, name: 'Banana' } as any,
      { revenue: 200, units: 10, estGrossMargin: 30, name: 'Apple' } as any,
    ];

    it('sorts by revenue desc', () => {
      const sorted = sortRowsForTable(rows, 'revenue-desc');
      expect(sorted[0].revenue).toBe(200);
    });

    it('sorts by units desc', () => {
      const sorted = sortRowsForTable(rows, 'units-desc');
      expect(sorted[0].units).toBe(10);
    });

    it('sorts by margin desc', () => {
      const sorted = sortRowsForTable(rows, 'margin-desc');
      expect(sorted[0].estGrossMargin).toBe(50);
    });

    it('sorts by name asc', () => {
      const sorted = sortRowsForTable(rows, 'name-asc');
      expect(sorted[0].name).toBe('Apple');
    });
  });
});
