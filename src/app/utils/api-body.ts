/**
 * Unwrap common API envelope shapes for a single entity (GET by id, POST response).
 */
export function normalizeApiRecord(body: unknown): unknown | null {
  if (body == null || body === "") {
    return null;
  }
  if (Array.isArray(body)) {
    return body.length ? body[0] : null;
  }
  if (typeof body !== "object") {
    return null;
  }
  const o = body as Record<string, unknown>;
  // Do not unwrap `Product` — Sequelize includes use that key on ProductPresentation rows;
  // unwrapping would drop presentation fields (productId, unitOfMeasure, …).
  const nested =
    o["data"] ??
    o["client"] ??
    o["Client"] ??
    o["product"] ??
    o["ProductPresentation"] ??
    o["productPresentation"] ??
    o["item"] ??
    o["result"] ??
    o["record"];
  if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
    return nested;
  }
  return body;
}

/** Unwrap list endpoints that return `{ data: [] }` etc. */
export function normalizeApiArray(body: unknown): unknown[] {
  let v: unknown = body;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) {
      return [];
    }
    try {
      v = JSON.parse(s) as unknown;
    } catch {
      return [];
    }
  }
  if (Array.isArray(v)) {
    return v;
  }
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const nested =
      o["data"] ??
      o["rows"] ??
      o["items"] ??
      o["results"] ??
      o["categories"] ??
      o["Categories"] ??
      o["category"] ??
      o["Category"] ??
      o["unitOfMeasures"] ??
      o["UnitOfMeasures"] ??
      o["unit_of_measures"] ??
      o["clients"] ??
      o["Clients"] ??
      o["productPresentations"] ??
      o["product_presentations"];
    if (Array.isArray(nested)) {
      return nested;
    }
    /** Some APIs return a single array-valued property with an unknown key. */
    const arrayValues = Object.values(o).filter(Array.isArray) as unknown[][];
    if (arrayValues.length === 1) {
      return arrayValues[0];
    }
  }
  return [];
}
