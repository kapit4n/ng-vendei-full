import {
  coerceCategoryRows,
  coerceUnitOfMeasureRows,
  categoryOptionLabel,
  uomOptionLabel,
} from './reg-catalog-entities';

describe('reg-catalog-entities utils', () => {
  describe('coerceCategoryRows', () => {
    it('normalizes category objects', () => {
      const rows = [{ id: 1, name: 'Fruits', code: 'FRU', description: 'Fresh fruits', img: 'img.png' }];
      const result = coerceCategoryRows(rows);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Fruits');
    });

    it('handles uppercase key variants', () => {
      const rows = [{ ID: 2, NAME: 'Drinks', CODE: 'DRK', DESCRIPTION: '', IMG: '' }];
      const result = coerceCategoryRows(rows);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
      expect(result[0].name).toBe('Drinks');
    });

    it('skips objects without id', () => {
      const rows = [{ name: 'No ID' }, { id: 1, name: 'Has ID' }];
      const result = coerceCategoryRows(rows);
      expect(result.length).toBe(1);
    });

    it('skips non-object values', () => {
      const rows = [null, 'string', 42, [1, 2], { id: 1 }];
      const result = coerceCategoryRows(rows);
      expect(result.length).toBe(1);
    });

    it('returns empty array for empty input', () => {
      expect(coerceCategoryRows([])).toEqual([]);
    });

    it('trims whitespace from fields', () => {
      const rows = [{ id: 1, name: '  Fruits  ', code: ' FRU ' }];
      const result = coerceCategoryRows(rows);
      expect(result[0].name).toBe('Fruits');
      expect(result[0].code).toBe('FRU');
    });
  });

  describe('coerceUnitOfMeasureRows', () => {
    it('normalizes UOM objects', () => {
      const rows = [{ id: 1, code: 'kg', name: 'Kilogram' }];
      const result = coerceUnitOfMeasureRows(rows);
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('kg');
    });

    it('handles uppercase key variants', () => {
      const rows = [{ ID: 2, CODE: 'lb', NAME: 'Pound' }];
      const result = coerceUnitOfMeasureRows(rows);
      expect(result[0].id).toBe(2);
      expect(result[0].name).toBe('Pound');
    });

    it('skips entries without id', () => {
      const rows = [{ code: 'x' }, { id: 1, code: 'kg' }];
      expect(coerceUnitOfMeasureRows(rows).length).toBe(1);
    });

    it('returns empty array for empty input', () => {
      expect(coerceUnitOfMeasureRows([])).toEqual([]);
    });
  });

  describe('categoryOptionLabel', () => {
    it('returns name when available', () => {
      expect(categoryOptionLabel({ id: 1, name: 'Fruits', code: '', description: '', img: '' })).toBe('Fruits');
    });

    it('falls back to code', () => {
      expect(categoryOptionLabel({ id: 1, name: '', code: 'FRU', description: '', img: '' })).toBe('FRU');
    });

    it('falls back to id-based label', () => {
      expect(categoryOptionLabel({ id: 1, name: '', code: '', description: '', img: '' })).toBe('Category #1');
    });

    it('returns empty when no fields available', () => {
      expect(categoryOptionLabel({ id: null, name: '', code: '', description: '', img: '' })).toBe('');
    });
  });

  describe('uomOptionLabel', () => {
    it('returns code — name format', () => {
      expect(uomOptionLabel({ id: 1, code: 'kg', name: 'Kilogram' })).toBe('kg — Kilogram');
    });

    it('returns code only when no name', () => {
      expect(uomOptionLabel({ id: 1, code: 'kg', name: '' })).toBe('kg');
    });

    it('returns name only when no code', () => {
      expect(uomOptionLabel({ id: 1, code: '', name: 'Kilogram' })).toBe('Kilogram');
    });

    it('falls back to id-based label', () => {
      expect(uomOptionLabel({ id: 1, code: '', name: '' })).toBe('Unit #1');
    });
  });
});
