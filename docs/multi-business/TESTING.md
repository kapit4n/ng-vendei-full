# Multi-Business Testing Strategy

## Guiding Principles

1. **Never remove or weaken existing tests** to make new implementations pass
2. **The POS checkout is business-critical** — regression tests are the safety net
3. **Every new domain capability gets tests** — services, components, integration
4. **Test configuration combinations** — not business type permutations

## Test Categories

### 1. Existing Regression Tests (MUST NOT BREAK)

These tests protect the current POS flow and must pass at every phase:

| Test File | Purpose | Count |
|-----------|---------|-------|
| `pos-checkout.component.spec.ts` | Core checkout unit tests | ~30 |
| `pos-checkout.integration.spec.ts` | Complete selling flow | 19 |
| `pos-checkout.failure.spec.ts` | Error scenarios + concurrency | 37 |
| `pos-catalog.component.spec.ts` | Catalog display | ~20 |
| `pos-catalog.integration.spec.ts` | Catalog selection flow | 12 |
| `pos-payment-panel.component.spec.ts` | Payment processing | ~20 |
| `pos-ticket-lines.component.spec.ts` | Cart line editing | ~15 |
| `v-*.service.spec.ts` | All service HTTP tests | ~23 |
| `*.spec.ts` (utils) | Utility function tests | ~126 |

**Total regression tests: ~294**

### 2. New Multi-Business Tests (per phase)

#### Phase 1: BusinessProfile Tests
- `business-profile.model.spec.ts` — Interface validation
- `v-store-profile.service.spec.ts` — Extended profile fields
- `business-profile.resolver.spec.ts` — Profile loading

#### Phase 2: Catalog Template Tests
- `catalog-template.service.spec.ts` — Template CRUD
- `catalog-template-seed.spec.ts` — Template application
- `template-product.spec.ts` — Product creation from template

#### Phase 3: Product Attribute Tests
- `product-attribute-definition.spec.ts` — Attribute CRUD
- `product-attribute-value.spec.ts` — Value assignment
- `product-variant.spec.ts` — Variant creation
- `variant-selection.spec.ts` — POS variant picker

#### Phase 4: Capability Tests
- `capability.service.spec.ts` — Capability management
- `capability-gating.spec.ts` — UI feature gating
- `capability-configuration.spec.ts` — Profile capability assignment

#### Phase 5: Selling Mode Tests
- `selling-mode.spec.ts` — Mode definitions
- `weight-calculation.spec.ts` — Weight-based pricing
- `variable-quantity.spec.ts` — Variable quantity pricing
- `combo-pricing.spec.ts` — Bundle pricing

#### Phase 6: POS Configuration Tests
- `pos-config.spec.ts` — Configuration model
- `configurable-layout.spec.ts` — Layout adaptation
- `configurable-payments.spec.ts` — Payment method config

#### Phase 7: Business Template Integration Tests
- `supermarket-checkout.integration.spec.ts`
- `chicken-store-checkout.integration.spec.ts`
- `butcher-checkout.integration.spec.ts`
- `clothing-checkout.integration.spec.ts`

### 3. E2E Tests (Playwright)

#### Existing (must not break)
- `smoke.spec.ts` — App load, navigation
- `app-pages.spec.ts` — Page rendering

#### New (per phase)
- `business-profile.spec.ts` — Profile creation/switching
- `template-selection.spec.ts` — Template-based setup
- `multi-business-checkout.spec.ts` — Cross-business checkout

## Test Execution Order

Before every major refactoring:

```bash
# 1. Unit tests (headless)
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless

# 2. POS regression tests (targeted)
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless \
  --include='**/pos-checkout*.spec.ts' \
  --include='**/pos-catalog*.spec.ts' \
  --include='**/pos-payment*.spec.ts' \
  --include='**/pos-ticket*.spec.ts'

# 3. Playwright E2E
npx playwright test

# 4. Production build
ng build --configuration production
```

## Coverage Targets

| Area | Target | Current |
|------|--------|---------|
| BusinessProfile | 90%+ | N/A |
| Capabilities | 90%+ | N/A |
| Product Attributes | 85%+ | N/A |
| Selling Modes | 85%+ | N/A |
| POS Checkout | 90%+ | ~85% |
| Catalog | 85%+ | ~80% |
| Overall | 80%+ | ~75% |

## Baseline Test Results

**Recorded:** 2026-08-25 (updated after MB-004)

### Unit Tests (Karma + Jasmine)

| Metric | Value |
|--------|-------|
| Total spec files | 57 |
| Total tests | 522 |
| Executed before disconnect | 85 |
| Passing (of executed) | 81 |
| Failing (pre-existing) | 4 |
| Execution time | ~1s (before disconnect) |

**Pre-existing failures (4):**
1. `PosCheckoutComponent printInvoiceAndSave closes the print window after onafterprint fires`
2. `PosCheckoutComponent printInvoiceAndSave does not call close on an already-closed window after onafterprint`
3. `PosCheckoutComponent submitOrder saves order and details`
4. `Failure Scenarios — Regression Price edge cases handles zero price product`

**Fixed during MB-001–MB-004 (6 scaffold tests resolved):**
- `InvProductsInvComponent should create` — fixed mock (added `getById`, `addToInventory`, etc.)
- `CustomerListComponent should create` — fixed mock (changed `loadCustomers` to `getAll`)
- Plus 4 fixes from previous session (AppComponent, RegCategory, RegCustomer, RegProduct, RegProductPresentation, RegCategoryList, RegCustomerList, RegProductList, CustomersDialog)

**Disconnect cause:** `afterAll` error from scaffold test, followed by 30s timeout. Pre-existing issue.

**Command:** `CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless`

### E2E Tests (Playwright)

| Metric | Value |
|--------|-------|
| Spec files | 2 |
| Tests | 9 |
| Status | PASS |

**Command:** `npx playwright test`

### Production Build

| Metric | Value |
|--------|-------|
| Build status | PASS (after fixing `extractCss` deprecation) |
| Output | dist/ng-vendei-full/ |
| Bundle size | 1.69 MB initial, 344.59 kB compressed |
| Build time | ~35s |
| Warnings | 3 (unused TypeScript files) |

**Command:** `npx ng build --configuration production`

**Fix applied:** Removed deprecated `extractCss: true` from `angular.json` production config.

### Known Test Issues

1. **Karma disconnect** — Test suite disconnects at ~252/494 tests due to `categorySvc.getAll is not a function` error in scaffold test. Pre-existing issue.
2. **3 scaffold failures** — Component tests with missing providers. Pre-existing.
3. **Angular Material warnings** — `NG0304` warnings in scaffold tests. Cosmetic, tests still pass.
4. **Build warnings** — 3 unused TypeScript files (`reg-product-quick-edit.component.ts`, `ang-seed-data.ts`, `test.ts`). Non-blocking.
