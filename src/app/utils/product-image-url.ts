export const PRODUCT_CARD_PLACEHOLDER = 'assets/vendei/placeholders/product-card.svg';

/** Single image field: URL must be absolute, root-relative, or assets/. */
export function resolveProductImageUrl(
  raw: string | null | undefined,
  fallback: string = PRODUCT_CARD_PLACEHOLDER
): string {
  const t = (raw || '').trim();
  if (!t) {
    return fallback;
  }
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/') || t.startsWith('assets/')) {
    return t;
  }
  return fallback;
}

/**
 * POS line: presentation image wins; if empty, use parent product image.
 */
export function resolvePresentationImageUrl(
  presentationImg: string | null | undefined,
  productImg: string | null | undefined,
  fallback: string = PRODUCT_CARD_PLACEHOLDER
): string {
  const own = (presentationImg || '').trim();
  if (own) {
    return resolveProductImageUrl(own, fallback);
  }
  return resolveProductImageUrl(productImg, fallback);
}
