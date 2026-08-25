# Sales Regression Testing

## Why These Tests Exist

The selling process (POS) is the most critical business flow in Vendei Full. Every sale involves:

```
Product → Catalog → Cart → Quantity → Pricing → Payment → Sale → Inventory → History
```

Any silent regression in this flow directly impacts revenue. These tests ensure the selling process remains a **protected business contract** that survives refactoring, bug fixes, new features, catalog changes, inventory changes, and UI changes.

## Test Architecture

Tests are organized at multiple levels:

### Level 1 — Unit Tests (Pure Logic)
- `src/app/utils/money.spec.ts` — Currency rounding, payment due, order readiness
- `src/app/features/vendei/payment-types.spec.ts` — Payment type enum stability
- `src/app/utils/product-image-url.spec.ts` — Image resolution and fallback
- `src/app/utils/product-display-text.spec.ts` — Product name/label parsing
- `src/app/utils/inv-expiry.spec.ts` — Inventory expiry helpers
- `src/app/utils/reg-catalog-entities.spec.ts` — Category/UOM normalization
- `src/app/utils/rep-sell-analytics.spec.ts` — Sell analytics calculations
- `src/app/utils/rep-product-sales-analytics.spec.ts` — Product sales analytics

### Level 1 — Service Tests (HTTP Mocking)
- `src/app/services/vendei/v-products.service.spec.ts`
- `src/app/services/vendei/v-categories.service.spec.ts`
- `src/app/services/vendei/v-orders.service.spec.ts`
- `src/app/services/vendei/v-inventory.service.spec.ts`
- `src/app/services/vendei/v-customers.service.spec.ts`

### Level 2 — Component Tests (Existing + Fixed)
- `src/app/features/vendei/product-list/pos-catalog.component.spec.ts`
- `src/app/features/vendei/cal-table/pos-payment-panel.component.spec.ts`
- `src/app/features/vendei/selected-list/pos-ticket-lines.component.spec.ts`
- `src/app/pages/vendei/shopping-cart/pos-checkout.component.spec.ts`
- 11 scaffold component tests (fixed — missing providers resolved)

### Level 3 — Integration Tests
- `src/app/pages/vendei/shopping-cart/pos-checkout.integration.spec.ts` — Complete selling flow (19 tests)
- `src/app/features/vendei/product-list/pos-catalog.integration.spec.ts` — Catalog selection flow (12 tests)
- `src/app/pages/vendei/shopping-cart/pos-checkout.failure.spec.ts` — Failure scenarios + concurrency (37 tests)

### Level 4 — E2E Tests (Playwright)
- `e2e/playwright/smoke.spec.ts` — App load, POS shell, admin FAB
- `e2e/playwright/app-pages.spec.ts` — Page-level smoke tests

## How to Run Tests

### All unit tests (headless)
```bash
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless
```

### With coverage report
```bash
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

### Playwright E2E
```bash
npx playwright test              # headless
npx playwright test --ui         # interactive UI
```

### Coverage report location
After running with `--code-coverage`, open:
```
coverage/index.html
```

## Coverage Thresholds

Enforced in `src/karma.conf.js`:

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

Critical sales business logic targets 90%+.

## CI Pipeline

GitHub Actions workflow at `.github/workflows/test.yml`:

1. **unit-tests** — runs on Node 18 and 20, executes `ng test --code-coverage`
2. **e2e-tests** — runs Playwright E2E smoke tests after unit tests pass

## Selling Process Contract

The following contract must always pass:

```
Given a valid product with available stock
When the user adds the product to the cart
Then the cart contains the correct product and quantity.

When the quantity changes
Then the subtotal is recalculated correctly.

When the customer pays
Then the payment is validated.

When the sale is completed
Then:
  - A sale is created
  - Sale items are created
  - Correct prices are snapshotted
  - Correct quantities are stored
  - Correct totals are stored
  - Inventory is reduced
  - The cart is cleared
  - The sale can be retrieved from history
```

## Known Issues

- Test suite disconnects after ~68 tests due to console.error logging from error-path tests (known Karma/ChromeHeadless issue)
- Playwright E2E requires backend to be running for full integration tests
- Angular Material template warnings (`NG0304`) in scaffold tests — cosmetic only, tests still pass

## Adding New Features

Every new feature that affects any of these areas **must** include or update regression tests:

| Change | Required Test Updates |
|--------|----------------------|
| New product field | Update product tests |
| Price calculation change | Update pricing tests |
| Inventory logic change | Update inventory tests |
| Checkout change | Update checkout tests |
| Payment method change | Update payment tests |
| Catalog/profile change | Update catalog tests |
| ProductCard UI change | Update POS interaction tests |

## Advisory Documentation

- `docs/testing/money-rounding-advisory.md` — IEEE 754 floating-point rounding issues with `roundToCents`
- `docs/testing/idempotency-layer.md` — Recommendations for order idempotency to prevent duplicate sales

## Developer Rule

> **Any change that can affect the selling process must include automated tests proving that the existing selling behavior still works.**
