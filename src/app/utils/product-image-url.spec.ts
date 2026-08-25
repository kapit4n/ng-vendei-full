import {
  resolveProductImageUrl,
  resolvePresentationImageUrl,
  PRODUCT_CARD_PLACEHOLDER,
} from './product-image-url';

describe('product-image-url utils', () => {
  describe('resolveProductImageUrl', () => {
    it('returns absolute http URL unchanged', () => {
      const url = 'http://example.com/img.jpg';
      expect(resolveProductImageUrl(url)).toBe(url);
    });

    it('returns absolute https URL unchanged', () => {
      const url = 'https://example.com/img.jpg';
      expect(resolveProductImageUrl(url)).toBe(url);
    });

    it('returns root-relative URL unchanged', () => {
      expect(resolveProductImageUrl('/uploads/img.jpg')).toBe('/uploads/img.jpg');
    });

    it('returns assets/ URL unchanged', () => {
      expect(resolveProductImageUrl('assets/img.jpg')).toBe('assets/img.jpg');
    });

    it('returns placeholder for empty string', () => {
      expect(resolveProductImageUrl('')).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('returns placeholder for null', () => {
      expect(resolveProductImageUrl(null)).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('returns placeholder for undefined', () => {
      expect(resolveProductImageUrl(undefined)).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('returns placeholder for whitespace-only', () => {
      expect(resolveProductImageUrl('   ')).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('returns placeholder for relative path without assets/', () => {
      expect(resolveProductImageUrl('uploads/img.jpg')).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('uses custom fallback when provided', () => {
      expect(resolveProductImageUrl('', 'custom-fallback.png')).toBe('custom-fallback.png');
    });
  });

  describe('resolvePresentationImageUrl', () => {
    it('prefers presentation image over product image', () => {
      const result = resolvePresentationImageUrl(
        '/uploads/presentation.jpg',
        '/uploads/product.jpg'
      );
      expect(result).toBe('/uploads/presentation.jpg');
    });

    it('falls back to product image when presentation is empty', () => {
      const result = resolvePresentationImageUrl('', '/uploads/product.jpg');
      expect(result).toBe('/uploads/product.jpg');
    });

    it('falls back to product image when presentation is null', () => {
      const result = resolvePresentationImageUrl(null, '/uploads/product.jpg');
      expect(result).toBe('/uploads/product.jpg');
    });

    it('returns placeholder when both are empty', () => {
      expect(resolvePresentationImageUrl('', '')).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('returns placeholder when both are null', () => {
      expect(resolvePresentationImageUrl(null, null)).toBe(PRODUCT_CARD_PLACEHOLDER);
    });

    it('uses custom fallback', () => {
      expect(resolvePresentationImageUrl('', '', 'custom.png')).toBe('custom.png');
    });
  });
});
