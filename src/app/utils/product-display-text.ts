/** Split catalog names like `Red Apple (1 lb)` into title + `(1 lb)` for POS cards and cart lines. */

export function productTitleFromFullName(full: string): string {
  const n = (full || "").trim();
  if (!n) {
    return "Product";
  }
  const stripped = n.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return stripped || n;
}

/** Parenthetical suffix from the full name, if present. */
export function productLabelFromFullName(full: string): string | null {
  const n = (full || "").trim();
  const m = n.match(/\(([^)]+)\)\s*$/);
  return m ? `(${m[1].trim()})` : null;
}

/** Optional unit/pack line when the API does not embed `(…)` in the name. */
export function productLabelFromFields(product: unknown): string | null {
  const p = product as Record<string, unknown> | null | undefined;
  const nested = p?.["Product"] as Record<string, unknown> | undefined;
  const raw =
    p?.["unitLabel"] ??
    nested?.["unitLabel"] ??
    p?.["packLabel"] ??
    nested?.["packLabel"] ??
    p?.["subtitle"] ??
    nested?.["subtitle"];
  if (raw != null && String(raw).trim() !== "") {
    const s = String(raw).trim();
    return s.startsWith("(") ? s : `(${s})`;
  }
  return null;
}
