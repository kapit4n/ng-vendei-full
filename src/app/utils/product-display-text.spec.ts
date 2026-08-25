import {
  productTitleFromFullName,
  productLabelFromFullName,
  productLabelFromFields,
} from './product-display-text';

describe('product-display-text utils', () => {
  describe('productTitleFromFullName', () => {
    it('strips parenthetical suffix', () => {
      expect(productTitleFromFullName('Red Apple (1 lb)')).toBe('Red Apple');
    });

    it('preserves name without parentheses', () => {
      expect(productTitleFromFullName('Red Apple')).toBe('Red Apple');
    });

    it('returns "Product" for empty string', () => {
      expect(productTitleFromFullName('')).toBe('Product');
    });

    it('returns "Product" for null/undefined', () => {
      expect(productTitleFromFullName(null as any)).toBe('Product');
      expect(productTitleFromFullName(undefined as any)).toBe('Product');
    });

    it('only strips last parenthetical', () => {
      expect(productTitleFromFullName('Foo (A) (B)')).toBe('Foo (A)');
    });

    it('handles name that is only parentheses', () => {
      expect(productTitleFromFullName('(1 lb)')).toBe('(1 lb)');
    });
  });

  describe('productLabelFromFullName', () => {
    it('extracts parenthetical suffix', () => {
      expect(productLabelFromFullName('Red Apple (1 lb)')).toBe('(1 lb)');
    });

    it('returns null when no parentheses', () => {
      expect(productLabelFromFullName('Red Apple')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(productLabelFromFullName('')).toBeNull();
    });

    it('extracts inner content from parentheses', () => {
      expect(productLabelFromFullName('Banana (500g)')).toBe('(500g)');
    });
  });

  describe('productLabelFromFields', () => {
    it('returns unitLabel from top level', () => {
      const result = productLabelFromFields({ unitLabel: 'kg' });
      expect(result).toBe('(kg)');
    });

    it('returns unitLabel from Product nested object', () => {
      const result = productLabelFromFields({ Product: { unitLabel: 'lb' } });
      expect(result).toBe('(lb)');
    });

    it('returns packLabel when no unitLabel', () => {
      const result = productLabelFromFields({ packLabel: '6-pack' });
      expect(result).toBe('(6-pack)');
    });

    it('returns subtitle as last resort', () => {
      const result = productLabelFromFields({ subtitle: 'large' });
      expect(result).toBe('(large)');
    });

    it('returns null when no label fields', () => {
      expect(productLabelFromFields({})).toBeNull();
    });

    it('returns null for null input', () => {
      expect(productLabelFromFields(null)).toBeNull();
    });

    it('wraps value in parentheses if not already', () => {
      expect(productLabelFromFields({ unitLabel: 'kg' })).toBe('(kg)');
    });

    it('does not double-wrap parentheses', () => {
      expect(productLabelFromFields({ unitLabel: '(kg)' })).toBe('(kg)');
    });
  });
});
