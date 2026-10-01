import {
  filterProductsByStoreType,
  storeTypeChips,
  storeTypeKey,
  storeTypeLabel,
} from './store-type-filter';

const supermarket = { id: 1, businessType: 'supermarket', slug: 'supermarket' };
const chicken = { id: 2, businessType: 'chicken-store', slug: 'chicken-store' };
const bakery = { id: 3, businessType: 'bakery', slug: 'bakery' };

describe('store-type-filter utils', () => {
  describe('storeTypeLabel', () => {
    it('humanizes a hyphenated business type', () => {
      expect(storeTypeLabel('chicken-store')).toBe('Chicken Store');
    });

    it('capitalizes each word', () => {
      expect(storeTypeLabel('auto parts')).toBe('Auto Parts');
    });

    it('falls back to Unknown when empty', () => {
      expect(storeTypeLabel('')).toBe('Unknown');
      expect(storeTypeLabel(null)).toBe('Unknown');
      expect(storeTypeLabel(undefined)).toBe('Unknown');
    });
  });

  describe('storeTypeKey', () => {
    it('prefers businessType over slug', () => {
      expect(storeTypeKey({ id: 1, businessType: 'bakery', slug: 'panaderia' })).toBe('bakery');
    });

    it('falls back to slug', () => {
      expect(storeTypeKey({ id: 1, slug: 'panaderia' })).toBe('panaderia');
    });

    it('returns empty string for a profile with neither', () => {
      expect(storeTypeKey({ id: 1 })).toBe('');
      expect(storeTypeKey(null)).toBe('');
    });
  });

  describe('storeTypeChips', () => {
    const products = [
      { id: 'a', storeProfileId: 1 },
      { id: 'b', storeProfileId: 1 },
      { id: 'c', storeProfileId: 2 },
    ];

    it('builds one chip per profile that owns products, with counts', () => {
      const chips = storeTypeChips(products, [supermarket, chicken, bakery]);
      expect(chips.length).toBe(2);
      const chickenChip = chips.find((c) => c.businessType === 'chicken-store');
      expect(chickenChip?.count).toBe(1);
      expect(chickenChip?.label).toBe('Chicken Store');
    });

    it('orders by descending count', () => {
      const chips = storeTypeChips(products, [supermarket, chicken]);
      expect(chips[0].businessType).toBe('supermarket');
      expect(chips[0].count).toBe(2);
    });

    it('omits profiles with no products', () => {
      const chips = storeTypeChips(products, [supermarket, bakery]);
      expect(chips.map((c) => c.businessType)).toEqual(['supermarket']);
    });

    it('returns no chips for an empty product list', () => {
      expect(storeTypeChips([], [supermarket, chicken])).toEqual([]);
    });

    it('ignores products whose profile is unknown', () => {
      const chips = storeTypeChips(
        [{ id: 'x', storeProfileId: 999 }],
        [supermarket]
      );
      expect(chips).toEqual([]);
    });

    it('ignores products with no storeProfileId', () => {
      const chips = storeTypeChips(
        [{ id: 'x', storeProfileId: null }, { id: 'y' }],
        [supermarket]
      );
      expect(chips).toEqual([]);
    });

    it('matches numeric ids against string ids', () => {
      const chips = storeTypeChips(
        [{ id: 'a', storeProfileId: '2' }],
        [supermarket, chicken]
      );
      expect(chips.length).toBe(1);
      expect(chips[0].businessType).toBe('chicken-store');
    });

    it('tolerates null inputs', () => {
      expect(storeTypeChips(null, null)).toEqual([]);
      expect(storeTypeChips(undefined, undefined)).toEqual([]);
    });
  });

  describe('filterProductsByStoreType', () => {
    const products = [
      { id: 'a', storeProfileId: 1 },
      { id: 'b', storeProfileId: 2 },
    ];

    it('returns everything when the filter is null', () => {
      expect(filterProductsByStoreType(products, null).length).toBe(2);
    });

    it('returns everything when the filter is empty string', () => {
      expect(filterProductsByStoreType(products, '').length).toBe(2);
    });

    it('keeps only the selected profile', () => {
      const filtered = filterProductsByStoreType(products, 2);
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('b');
    });

    it('compares loosely across string and number ids', () => {
      expect(filterProductsByStoreType(products, '1').length).toBe(1);
    });

    it('returns nothing for an unknown profile', () => {
      expect(filterProductsByStoreType(products, 999)).toEqual([]);
    });

    it('returns a copy, not the original array', () => {
      const result = filterProductsByStoreType(products, null);
      expect(result).not.toBe(products as unknown as typeof result);
    });

    it('tolerates null input', () => {
      expect(filterProductsByStoreType(null, null)).toEqual([]);
    });
  });
});
