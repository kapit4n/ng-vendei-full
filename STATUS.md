# Vendei Full — Current Status

> Last updated: August 25, 2026

---

## Overview

Vendei Full is a Point-of-Sale (POS) and Inventory Management System built as an Angular 21 single-page application. It provides a touch-friendly checkout interface, product catalog browsing, payment processing, thermal receipt printing, customer management, inventory tracking with lot-level expiry monitoring, and sales analytics reports.

- **Frontend:** Angular 21.2.8, Angular Material 21.2.6
- **Backend:** Node.js/Express (separate repo: [inventory-nod](https://github.com/kapit4n/inventory-nod)) on port 3000
- **Database:** PostgreSQL (via Sequelize ORM in backend)
- **Currency:** Bolivianos (Bs)

---

## File Statistics

| Metric | Count |
|--------|-------|
| TypeScript files (`src/`) | 140 |
| Spec/test files (`*.spec.ts`) | 57 |
| HTML templates | 41 |
| CSS files | 41 |
| Asset files (`src/assets/`) | 127 |
| Catalog SVG product images | 75 |
| Routes defined | 33 |
| Components | 35+ |
| Services | 27 |
| Utility modules | 10 |
| Lines of code (FEATURES.md) | 816 |

---

## Technology Stack

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/core` | ^21.2.8 | Framework |
| `@angular/material` | ^21.2.6 | UI components |
| `@angular/cdk` | ^21.2.6 | Component dev kit |
| `@angular/router` | ^21.2.8 | Routing |
| `@angular/forms` | ^21.2.8 | Forms (reactive + template-driven) |
| `chart.js` | ^4.5.1 | Charts for reports |
| `font-awesome` | ^4.7.0 | Icons |
| `rxjs` | 7.5.6 | Reactive programming |
| `zone.js` | ^0.15.1 | Angular change detection |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/cli` | ~21.2.7 | Build tooling |
| `typescript` | ~5.9.3 | Language |
| `karma` | ~6.4.0 | Unit test runner |
| `jasmine-core` | ~3.4.0 | Unit test framework |
| `protractor` | ~7.0.0 | Legacy E2E (deprecated) |
| `tslint` | ~5.17.0 | Linter (deprecated) |
| `playwright` | via npx | Modern E2E |

### NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `start` | `ng serve` | Dev server (port 4200, proxy to 3000) |
| `build` | `ng build` | Production build |
| `test` | `ng test` | Unit tests (Karma) |
| `lint` | `ng lint` | Linting |
| `e2e` | `ng e2e` | E2E (Protractor, deprecated) |
| `e2e:playwright` | `npx playwright test` | E2E (Playwright) |
| `e2e:playwright:ui` | `npx playwright test --ui` | E2E interactive |
| `start:full` | `bash scripts/run-full-stack.sh` | Full stack |
| `start:full:db-seed` | `FULL_STACK_DB=seed bash scripts/run-full-stack.sh` | Full stack + seed |

---

## Architecture

### Single NgModule Design

All 35+ components are declared in one `AppModule`. Routes are defined inline. No lazy-loaded feature modules. The `AppComponent` switches between two layouts:

- **POS shell** (`/` route): Minimal UI — product grid, cart, payment panel, admin FAB
- **Admin shell** (all other routes): Top navigation bar with section links

### Application Structure

```
src/app/
├── app.module.ts                    # Root module (all routes + providers)
├── app.component.ts                 # Shell layout (POS vs admin)
├── components/auth/login/           # Login component
├── features/vendei/                 # POS sub-components
│   ├── product-list/                # Product grid (PosCatalogComponent)
│   ├── selected-list/               # Cart lines + edit dialog
│   ├── cal-table/                   # Payment panel
│   ├── customer-list/               # Customer list (inline)
│   ├── customers-dialog/            # Customer selection dialog
│   ├── store-profile-selector/      # Multi-store profile
│   ├── profile-switch-dialog/       # Profile switch confirmation
│   └── payment-types.ts             # PaymentType enum
├── pages/                           # Route-level pages
│   ├── main/                        # Dashboard hub
│   ├── vendei/shopping-cart/        # POS checkout page
│   ├── reg/                         # Registration (products, categories, customers, UoM)
│   ├── inv/                         # Inventory management
│   ├── rep/                         # Reports & analytics
│   ├── tools/                       # API browser
│   └── ang/                         # Angular exams module
├── services/                        # HTTP/data services
│   ├── vendei/ (8 services)         # POS services
│   ├── reg/ (8 services)            # Registration services
│   ├── inv/ (3 services)            # Inventory services
│   ├── rep/ (4 services)            # Report services
│   ├── tools/ (1 service)           # API catalog
│   └── ang/ (2 services)            # Exam services
└── utils/ (10 modules)              # Shared helpers
```

---

## Features

### 1. POS Checkout (`/`)
Touch-friendly checkout with product grid, cart management, payment processing (cash/QR), discounts, returns, thermal receipt printing, multi-store profile switching, and customer assignment.

### 2. Product Registration (`/reg/products`)
Full CRUD for products with presentations (variations), images, code, price, category, and unit of measure. Includes quick-edit mode.

### 3. Category Management (`/reg/categories`)
Full CRUD for product categories with delete guards.

### 4. Customer Management (`/reg/customers`)
Full CRUD for customers with inline POS selection and search.

### 5. Unit of Measure (`/reg/unit-of-measures`)
Full CRUD for units of measure (kg, L, unit, etc.).

### 6. Product Presentations (`/reg/productPresentations`)
Product variations with different units, prices, and images.

### 7. Inventory Management (`/inv/products`)
Product stock list with lot-level tracking, per-product detail with expiry monitoring (past/soon/normal visual indicators), auto-decrement on POS order.

### 8. Sales Reports (`/rep/sells`)
Date-range filtering, daily + monthly bar charts, total revenue analytics.

### 9. Product Sales Report (`/rep/products`)
Executive summary, sortable analytics table, slow-mover detection, bar charts.

### 10. Daily Sales Report (`/rep/daily-sales`)
Cash vs QR payment breakdown, net totals, payment method chart.

### 11. Sales by Product (`/rep/sells-by-product`)
Per-product sales view.

### 12. Sales by Order (`/rep/sells-by-order`)
Per-order sales view.

### 13. Backend API Browser (`/tools/backend-api`)
Lists all API endpoints, database model introspection, Swagger link.

### 14. Angular Exams Module (`/angular/`)
Questions CRUD, exam creation with random selection, exam taking, results, Angular features guide.

### 15. Multi-Store Profiles
Store profile selector with profile switching (clears cart on confirmation).

---

## Routing — All 33 Routes

| Path | Component | Section |
|------|-----------|---------|
| `/` | PosCheckoutComponent | POS |
| `/mock` | MainScreenshotComponent | Dev |
| `/main` | MainComponent | Dashboard |
| `/customers` | RegCustomerListComponent | POS shortcut |
| `/reg/products` | RegProductListComponent | Registration |
| `/reg/products/new` | RegProductComponent | Registration |
| `/reg/products/view/:id` | RegProductShowComponent | Registration |
| `/reg/products/:id` | RegProductComponent | Registration |
| `/reg/productPresentations/new` | RegProductPresentationComponent | Registration |
| `/reg/productPresentations/:id` | RegProductPresentationComponent | Registration |
| `/reg/categories` | RegCategoryListComponent | Registration |
| `/reg/categories/new` | RegCategoryComponent | Registration |
| `/reg/categories/:id` | RegCategoryComponent | Registration |
| `/reg/unit-of-measures` | RegUnitOfMeasureListComponent | Registration |
| `/reg/unit-of-measures/:id` | RegUnitOfMeasureComponent | Registration |
| `/reg/customers` | RegCustomerListComponent | Registration |
| `/reg/customers/new` | RegCustomerComponent | Registration |
| `/reg/customers/:id` | RegCustomerComponent | Registration |
| `/inv/products` | InvProductsComponent | Inventory |
| `/inv/products/:id` | InvProductsInvComponent | Inventory |
| `/rep/products` | RepProductsComponent | Reports |
| `/rep/sells` | RepSellsComponent | Reports |
| `/rep/daily-sales` | RepDailySalesComponent | Reports |
| `/tools/backend-api` | BackendApiPageComponent | Tools |
| `/angular/questions` | AngQuestionsComponent | Angular Exams |
| `/angular/questions/new` | AngQuestionFormComponent | Angular Exams |
| `/angular/questions/:id` | AngQuestionFormComponent | Angular Exams |
| `/angular/exams` | AngExamsComponent | Angular Exams |
| `/angular/exams/new` | AngExamFormComponent | Angular Exams |
| `/angular/exams/take/:id` | AngExamTakeComponent | Angular Exams |
| `/angular/exams/result/:id` | AngExamResultComponent | Angular Exams |
| `/angular/guide` | AngFeaturesGuideComponent | Angular Exams |
| `**` | PageNotFoundComponent | 404 |

---

## Testing

### Unit Tests (Karma + Jasmine)

| Area | Spec Files | Coverage |
|------|------------|----------|
| App root | 1 | Shell layout, title |
| POS features | 8 | Catalog, payment panel, ticket lines, customers, store profile, payment types |
| POS pages | 3 | Checkout (unit, integration, failure), page-not-found, main-screenshot |
| Registration | 7 | Products, categories, customers, product presentations |
| Inventory | 2 | Products, products-inv |
| Reports | 5 | Products, sells, daily-sales, sells-by-product, sells-by-order |
| Services | 28 | All service layers |
| Utils | 8 | Money, expiry, display text, image URL, catalog entities, analytics |
| Auth | 1 | Login |
| **Total** | **57** | |

### Test Commands

```bash
# Unit tests (headless)
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless

# Unit tests with coverage
CHROME_BIN=/usr/bin/google-chrome npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

# Playwright E2E
npx playwright test
npx playwright test --ui
```

### Coverage Thresholds (karma.conf.js)

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

### E2E Tests (Playwright)

- `e2e/playwright/smoke.spec.ts` — App load, POS shell, admin FAB, navigation (6 tests)
- `e2e/playwright/app-pages.spec.ts` — Page-level smoke tests (3 tests)

---

## Backend Integration

### Proxy Configuration

All API requests are proxied to `http://127.0.0.1:3000` in development:

| Proxy Path | Target |
|------------|--------|
| `/api` | Backend API |
| `/uploads` | File uploads |
| `/products` | Products |
| `/categories` | Categories |
| `/unitOfMeasures` | Units of measure |
| `/clients` | Customers |
| `/orders` | Orders |
| `/orderDetails` | Order details |
| `/inventory-lots` | Inventory lots |
| `/storeProfiles` | Store profiles |
| `/productPresentations` | Product presentations |
| `/ang-questions` | Angular exam questions |
| `/ang-exams` | Angular exams |
| `/ang-results` | Angular exam results |

### Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/products` | Product CRUD |
| GET/POST | `/categories` | Category CRUD |
| GET/POST | `/clients` | Customer CRUD |
| GET/POST | `/orders` | Order management |
| GET/POST | `/orderDetails` | Order line items |
| GET/POST | `/inventory-lots` | Inventory lot tracking |
| GET | `/orders/today-summary` | Daily sales summary |
| POST | `/products/:id/reduce-inventory` | Stock reduction |
| POST | `/products/:id/update-total-selled` | Revenue tracking |
| POST | `/products/:id/update-quantity-selled` | Units-sold tracking |
| GET | `/api/catalog` | API endpoint catalog |
| GET | `/api/models` | Database model introspection |

### Environment Configuration

| File | `production` | `apiBaseUrl` |
|------|-------------|--------------|
| `environment.ts` | `false` | `''` (uses proxy) |
| `environment.prod.ts` | `true` | `'http://localhost:3000'` |

---

## CI/CD

### GitHub Actions (`.github/workflows/test.yml`)

Two-job pipeline triggered on push/PR to `main`, `master`, `develop`:

**Job 1: `unit-tests`**
- Matrix: Node 18, 20
- Runs `ng test --code-coverage` in ChromeHeadless
- Uploads coverage artifact (Node 20, 14-day retention)

**Job 2: `e2e-tests`** (depends on unit-tests)
- Node 20
- Installs Playwright Chromium
- Runs `npx playwright test`
- Uploads Playwright report on failure

### Deployment

- No Docker configuration
- Static build output (`dist/ng-vendei-full/`) deployed to web server
- Production build uses AOT, optimization, output hashing

---

## Documentation

| File | Lines | Content |
|------|-------|---------|
| `README.md` | 10 | Brief intro |
| `ARCHITECTURE.md` | 135 | Tech stack, data flow, DB schema, project structure |
| `FEATURES.md` | 816 | Comprehensive feature docs with screenshots |
| `ALL.md` | 34 | Screenshot gallery |
| `docs/testing/sales-regression.md` | — | Sales regression test plan |
| `docs/testing/sales-regression-progress.md` | — | Testing progress tracker |
| `docs/testing/money-rounding-advisory.md` | — | IEEE 754 floating-point advisory |
| `docs/testing/idempotency-layer.md` | — | Order idempotency recommendations |
| `docs/angular-exams-plan.md` | 184 | Angular exams implementation plan |
| `docs/features/multi-store-catalog.md` | — | Multi-store feature plan |

---

## Known Issues & Technical Debt

### Critical

- **Production `apiBaseUrl`** points to `localhost:3000` — should use environment variable or reverse proxy

### High

- **TSLint is deprecated** — should migrate to ESLint with `@angular-eslint`
- **Single NgModule** — all 35+ components in one module; no lazy loading
- **`rxjs-compat`** still in dependencies (only needed for rxjs 5→6 migration, can be removed)

### Medium

- **No Prettier** configured — no code formatting enforcement
- **Services not using `providedIn: 'root'`** — manually listed in module providers array
- **Angular 21 with `standalone: false`** — could modernize to standalone components
- **No route guards** defined
- **No HTTP interceptors** configured
- **Test suite disconnect** — Karma/ChromeHeadless disconnects after ~68 tests due to console.error logging

### Low

- **No Docker/containerization** for deployment
- **Protractor** still in devDependencies (deprecated, Playwright is active replacement)
- **Proxy paths may be stale** for recently migrated features (ang-questions, ang-exams)

---

## Recent Git History

| Hash | Message |
|------|---------|
| `a989e4a` | test: add comprehensive POS regression tests and CI pipeline |
| `ce197ea` | feat: add store profile selector, checkout improvements, and catalog enhancements |
| `d33ead9` | chore: remove old demo product images and reorganize assets |
| `a48636a` | docs: add scraping contract artifacts for l-projects dashboard |
| `c0affdf` | docs: update POS home screenshot with products loaded |
| `60eeca1` | docs: update README with main home screenshot |
| `7856b6e` | docs: update screenshots and rename main screenshot to home.png |
| `7a5b6fc` | feat: add pagination, filtered count, and duplicate removal to questions page |
| `4d8fdb4` | feat: migrate Angular exam data to backend API with HTTP services |
| `e034339` | feat: add Angular Features Guide page with top-nav menu entry and hub tile |

---

## Recommendations

1. **Migrate TSLint → ESLint** — TSLint has been deprecated since 2019
2. **Add Prettier** — enforce consistent code formatting
3. **Remove `rxjs-compat`** — not needed for rxjs 7.x
4. **Adopt `providedIn: 'root'`** — tree-shakeable providers reduce bundle size
5. **Lazy-load feature modules** — split `AppModule` into feature modules
6. **Add route guards** — protect admin routes from unauthenticated access
7. **Add HTTP interceptors** — for auth tokens, error handling, loading indicators
8. **Fix production `apiBaseUrl`** — use environment variable or reverse proxy
9. **Add Docker** — containerize frontend for consistent deployment
10. **Complete Playwright migration** — remove Protractor dependency
