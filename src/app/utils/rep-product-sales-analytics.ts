/**
 * Analytics for the product sales report (lifetime totals from Product.quantitySelled / totalSelled).
 */

export function parseProductNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface ProductSalesAnalyticsRow {
  id: string;
  name: string;
  code: string;
  units: number;
  revenue: number;
  stock: number;
  cost: number;
  price: number;
  /** Uses current product cost × units sold as a simple COGS proxy. */
  estGrossMargin: number;
  /** Share of total revenue across all products (0–100). */
  shareOfRevenuePct: number;
  avgUnitPrice: number;
}

export interface ProductSalesExecutiveSummary {
  totalRevenue: number;
  totalUnits: number;
  skuCount: number;
  skuWithSales: number;
  avgSellingPrice: number;
  estTotalGrossMargin: number;
  /** Smallest number of SKUs (ranked by revenue) whose cumulative revenue reaches 80%. */
  pareto80Count: number;
  /** Combined revenue share of the top 3 SKUs (0–100). */
  topThreeRevenueSharePct: number;
}

export function mapProductsToSalesRows(rawList: unknown[]): ProductSalesAnalyticsRow[] {
  const rows: ProductSalesAnalyticsRow[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const p = raw as Record<string, unknown>;
    const id = p['id'] != null ? String(p['id']) : '';
    if (!id) {
      continue;
    }
    const units = parseProductNum(p['quantitySelled']);
    const revenue = parseProductNum(p['totalSelled']);
    const stock = parseProductNum(p['stock']);
    const cost = parseProductNum(p['cost']);
    const price = parseProductNum(p['price']);
    const avgUnitPrice = units > 0 ? revenue / units : 0;
    const estGrossMargin = revenue - cost * units;
    rows.push({
      id,
      name: String(p['name'] ?? '—'),
      code: String(p['code'] ?? ''),
      units,
      revenue,
      stock,
      cost,
      price,
      estGrossMargin,
      shareOfRevenuePct: 0,
      avgUnitPrice,
    });
  }
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  for (const r of rows) {
    r.shareOfRevenuePct = totalRev > 0 ? (100 * r.revenue) / totalRev : 0;
  }
  return rows;
}

export function sortRowsByRevenueDesc(rows: ProductSalesAnalyticsRow[]): ProductSalesAnalyticsRow[] {
  return [...rows].sort((a, b) => b.revenue - a.revenue);
}

export function buildExecutiveSummary(
  rows: ProductSalesAnalyticsRow[],
  byRevenueDesc: ProductSalesAnalyticsRow[]
): ProductSalesExecutiveSummary {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const skuCount = rows.length;
  const skuWithSales = rows.filter((r) => r.units > 0 || r.revenue > 0).length;
  const avgSellingPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
  const estTotalGrossMargin = rows.reduce((s, r) => s + r.estGrossMargin, 0);
  const topThreeRevenueSharePct = (() => {
    if (totalRevenue <= 0) {
      return 0;
    }
    const top3 = byRevenueDesc.slice(0, 3).reduce((s, r) => s + r.revenue, 0);
    return (100 * top3) / totalRevenue;
  })();
  const pareto80Count = countSkusForCumulativeRevenueShare(byRevenueDesc, totalRevenue, 0.8);
  return {
    totalRevenue,
    totalUnits,
    skuCount,
    skuWithSales,
    avgSellingPrice,
    estTotalGrossMargin,
    pareto80Count,
    topThreeRevenueSharePct,
  };
}

function countSkusForCumulativeRevenueShare(
  sortedByRevenueDesc: ProductSalesAnalyticsRow[],
  totalRevenue: number,
  targetFraction: number
): number {
  if (totalRevenue <= 0 || !sortedByRevenueDesc.length) {
    return 0;
  }
  let cum = 0;
  for (let i = 0; i < sortedByRevenueDesc.length; i++) {
    cum += sortedByRevenueDesc[i].revenue;
    if (cum / totalRevenue >= targetFraction) {
      return i + 1;
    }
  }
  return sortedByRevenueDesc.length;
}

/** SKUs with on-hand stock but no recorded sales (possible dead stock). */
export function pickSlowMovers(rows: ProductSalesAnalyticsRow[], limit: number): ProductSalesAnalyticsRow[] {
  return [...rows]
    .filter((r) => r.stock > 0 && r.revenue === 0 && r.units === 0)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, limit);
}

export function sortRowsForTable(
  rows: ProductSalesAnalyticsRow[],
  sortKey: 'revenue-desc' | 'units-desc' | 'margin-desc' | 'name-asc'
): ProductSalesAnalyticsRow[] {
  const copy = [...rows];
  switch (sortKey) {
    case 'revenue-desc':
      copy.sort((a, b) => b.revenue - a.revenue);
      break;
    case 'units-desc':
      copy.sort((a, b) => b.units - a.units);
      break;
    case 'margin-desc':
      copy.sort((a, b) => b.estGrossMargin - a.estGrossMargin);
      break;
    case 'name-asc':
      copy.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      break;
  }
  return copy;
}
