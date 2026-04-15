/** Round to two decimal places for currency display and totals. */
export function roundToCents(value: number | string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
