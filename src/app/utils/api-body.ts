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
  if (Array.isArray(body)) {
    return body;
  }
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const nested =
      o["data"] ??
      o["rows"] ??
      o["items"] ??
      o["results"] ??
      o["productPresentations"] ??
      o["product_presentations"];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}
