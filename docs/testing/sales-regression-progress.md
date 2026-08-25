# Sales Regression Testing Progress

## Status

All improvements complete.

## What Was Done

### Phase 1-8: Core Testing Framework (previous session)
- Full architecture inspection
- 195 new unit, service, integration, and failure tests across 16 files
- 494 total tests (up from 292 original)

### Improvement 1: Fixed Pre-existing Scaffold Tests
- Fixed 11 broken `should create` tests across scaffold spec files
- Root cause: missing `Router`, service mocks, and `NO_ERRORS_SCHEMA`
- Files fixed:
  - `src/app/app.component.spec.ts`
  - `src/app/pages/reg/reg-category/reg-category.component.spec.ts`
  - `src/app/pages/reg/reg-customer/reg-customer.component.spec.ts`
  - `src/app/pages/reg/reg-product/reg-product.component.spec.ts`
  - `src/app/pages/reg/reg-product-presentation/reg-product-presentation.component.spec.ts`
  - `src/app/pages/inv/inv-products-inv/inv-products-inv.component.spec.ts`
  - `src/app/features/vendei/customers-dialog/customers-dialog.component.spec.ts`
  - `src/app/features/vendei/customer-list/customer-list.component.spec.ts`
  - `src/app/pages/reg/reg-category-list/reg-category-list.component.spec.ts`
  - `src/app/pages/reg/reg-customer-list/reg-customer-list.component.spec.ts`
  - `src/app/pages/reg/reg-product-list/reg-product-list.component.spec.ts`

### Improvement 2: Coverage Thresholds
- Added Istanbul coverage thresholds to `src/karma.conf.js`
- Thresholds: statements 80%, branches 70%, functions 80%, lines 80%
- Added `text-summary` reporter for terminal output

### Improvement 3: CI Pipeline with GitHub Actions
- Created `.github/workflows/test.yml` with two jobs:
  - `unit-tests`: runs `ng test --code-coverage` on Node 18 and 20
  - `e2e-tests`: runs Playwright E2E smoke tests
- Uploads coverage and Playwright reports as artifacts

### Improvement 4: Playwright E2E (replaces deprecated Protractor)
- Added `playwright.config.ts` with Chromium project
- Created `e2e/playwright/smoke.spec.ts` (app load, navigation)
- Created `e2e/playwright/app-pages.spec.ts` (catalog, checkout pages)
- Added `e2e:playwright` and `e2e:playwright:ui` npm scripts
- Web server auto-starts Angular dev server for E2E

### Improvement 5: Concurrency Tests
- Added 7 new tests to `pos-checkout.failure.spec.ts`:
  - `saveOrder` creates only one order per call
  - Sequential saves create separate orders
  - First save error doesn't block second save
  - Concurrent saves both reduce inventory independently
  - `clearItems` fully resets all state
  - `recalTotal` produces consistent results across multiple calls
  - `removeItem` doesn't mutate unrelated items

### Improvement 6: Advisory Documentation
- `docs/testing/money-rounding-advisory.md` — IEEE 754 floating-point issues
- `docs/testing/idempotency-layer.md` — Recommendations for order idempotency

## Final Test Count

| Category | Files | Tests |
|----------|-------|-------|
| Unit (pure logic) | 8 | ~126 |
| Service (HTTP) | 5 | ~23 |
| Integration (selling flow) | 2 | 31 |
| Failure scenarios | 1 | 37 |
| Component scaffolds | 11 | 11 |
| Existing pre-existing | 46+ | ~266 |
| **Total** | **73+** | **494** |

## Commands

```bash
# Unit tests (headless)
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless

# Unit tests with coverage
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

# Playwright E2E
npx playwright test
npx playwright test --ui
```

## Files Modified

- `src/karma.conf.js` — coverage thresholds
- `src/app/app.component.spec.ts` — fixed providers
- `src/app/pages/reg/*//*.component.spec.ts` — fixed providers (8 files)
- `src/app/pages/inv/inv-products-inv/inv-products-inv.component.spec.ts` — fixed providers
- `src/app/features/vendei/customers-dialog/customers-dialog.component.spec.ts` — fixed providers
- `src/app/features/vendei/customer-list/customer-list.component.spec.ts` — fixed providers
- `src/app/pages/vendei/shopping-cart/pos-checkout.failure.spec.ts` — added concurrency tests
- `package.json` — added Playwright scripts

## Files Created

- `.github/workflows/test.yml` — CI pipeline
- `playwright.config.ts` — Playwright configuration
- `e2e/playwright/smoke.spec.ts` — POS smoke tests
- `e2e/playwright/app-pages.spec.ts` — page-level E2E tests
- `docs/testing/money-rounding-advisory.md` — IEEE 754 advisory
- `docs/testing/idempotency-layer.md` — Idempotency recommendations
