import type { ICategory } from '../services/reg/r-category.service';
import type { IUnitOfMeasure } from '../services/reg/r-unit-of-measure.service';

/** Normalize category rows from Sequelize / proxies / odd JSON keys for templates and selects. */
export function coerceCategoryRows(rows: unknown[]): ICategory[] {
  const out: ICategory[] = [];
  for (const c of rows) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) {
      continue;
    }
    const o = c as Record<string, unknown>;
    const id = o['id'] ?? o['ID'];
    if (id == null) {
      continue;
    }
    out.push({
      id: id as string | number,
      name: String(o['name'] ?? o['NAME'] ?? o['Name'] ?? '').trim(),
      code: String(o['code'] ?? o['CODE'] ?? o['Code'] ?? '').trim(),
      description: String(o['description'] ?? o['DESCRIPTION'] ?? '').trim(),
      img: String(o['img'] ?? o['IMG'] ?? '').trim(),
    });
  }
  return out;
}

/** Normalize UOM rows for templates and selects. */
export function coerceUnitOfMeasureRows(rows: unknown[]): IUnitOfMeasure[] {
  const out: IUnitOfMeasure[] = [];
  for (const u of rows) {
    if (!u || typeof u !== 'object' || Array.isArray(u)) {
      continue;
    }
    const o = u as Record<string, unknown>;
    const id = o['id'] ?? o['ID'];
    if (id == null) {
      continue;
    }
    out.push({
      id: id as string | number,
      code: String(o['code'] ?? o['CODE'] ?? '').trim(),
      name: String(o['name'] ?? o['NAME'] ?? '').trim(),
    });
  }
  return out;
}

export function categoryOptionLabel(c: ICategory): string {
  const n = (c.name || '').trim();
  if (n) {
    return n;
  }
  const code = (c.code || '').trim();
  if (code) {
    return code;
  }
  return c.id != null ? `Category #${c.id}` : '';
}

export function uomOptionLabel(u: IUnitOfMeasure): string {
  const code = (u.code || '').trim();
  const name = (u.name || '').trim();
  if (code && name) {
    return `${code} — ${name}`;
  }
  return code || name || (u.id != null ? `Unit #${u.id}` : '');
}
