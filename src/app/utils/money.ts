/** Round to two decimal places for currency display and totals. */
export function roundToCents(value: number | string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Remaining balance for the ticket (after discounts), net of payments and change lines.
 * Zero or below means collected amount covers the order.
 */
export function orderAmountDue(
  orderTotal: number,
  totalPayed: number,
  totalReturn: number,
  totalDiscount: number
): number {
  const netOrder = Math.max(0, roundToCents((orderTotal || 0) - (totalDiscount || 0)));
  const effective = roundToCents((totalPayed || 0) - (totalReturn || 0));
  return roundToCents(Math.max(0, netOrder - effective));
}

/** True when the ticket has a total, checkout is not in the print step, and balance due is covered. */
export function isOrderReadyToSubmit(
  orderTotal: number,
  totalPayed: number,
  totalReturn: number,
  totalDiscount: number,
  printOrderCount: number | null | undefined
): boolean {
  const locked = Number(printOrderCount) > 0;
  return (
    (orderTotal || 0) > 0 &&
    !locked &&
    orderAmountDue(orderTotal, totalPayed, totalReturn, totalDiscount) <= 0
  );
}
