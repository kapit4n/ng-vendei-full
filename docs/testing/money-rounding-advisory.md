# roundToCents Floating-Point Advisory

## The Problem

JavaScript uses IEEE 754 double-precision floating-point for all numbers. This
means certain decimal values cannot be represented exactly, leading to subtle
rounding surprises:

```
> Math.round((32.675 + Number.EPSILON) * 100) / 100
32.67   // NOT 32.68
```

This happens because `32.675` is actually stored as `32.674999...9963` in binary,
so `32.674999... * 100 = 3267.4999...` and `Math.round(3267.4999...) = 3267`.

## How `roundToCents` Handles It

```typescript
export function roundToCents(value: number | string | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
```

Adding `Number.EPSILON` (~2.2e-16) before multiplying pushes the value just
past the rounding boundary for *most* cases, but it does not guarantee correct
rounding for all IEEE 754 edge cases (e.g. `32.675`).

## Recommendation: Use Integer Cents

For zero-surprise money math, store and compute all monetary values as
**integer centavos** (the smallest currency unit). Only convert to `Bs.XX`
strings at the display layer:

```typescript
// storage / computation
const priceCents = 3267;  // Bs. 32.67

// display
const displayBs = (priceCents / 100).toFixed(2);
```

This eliminates floating-point rounding issues entirely.

## Current Status

- `roundToCents` is used throughout the POS (cart totals, invoice lines,
  order amounts).
- The existing test suite explicitly asserts `roundToCents(32.675) === 32.67`
  so regressions are caught.
- A migration to integer cents would be a **breaking change** for the backend
  API contract and database schema. It is recommended for a future major version.

## References

- [What Every Programmer Needs to Know About Floating-Point Arithmetic](https://floating-point-gui.de/)
- [MDN: Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)
