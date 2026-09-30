# Current Architecture (as inspected)

Status: **baseline snapshot** taken on branch `refactor/deployment-architecture`
at commit `c412dd7` before any refactoring.

This document describes what the code **actually does**, verified by reading source.
Where the existing documentation (`ARCHITECTURE.md`) disagrees with the code, the code
wins and the disagreement is called out explicitly.

---

## 1. Top-level request path

```
┌──────────────────────────────────────────────────────────────┐
│ Angular SPA  (ng-vendei-full — THIS repository)              │
│                                                              │
│  app.module.ts                                              │
│    ├─ eager: AppComponent, MainComponent, Ang* pages,        │
│    │         Inv* pages, BackendApiPageComponent             │
│    └─ lazy : /  → features/vendei/vendei-feature.module      │
│               /reg   → features/reg/reg-feature.module        │
│               /rep   → features/rep/rep-feature.module        │
│               /settings → features/settings/...              │
│                                                              │
│  27 services inject HttpClient                              │
│  every service builds its own URL:  `${baseUrl}/<resource>`  │
│  4 near-duplicate "config" services expose `.baseUrl`        │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP (JSON)
                            │ baseUrl = environment.apiBaseUrl
                            │   dev  : ''  → dev-server → proxy.conf.json
                            │   prod : ''  → same-origin
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ Express API  (inventory-nod — SEPARATE repository)           │
│  remote: git@github.com:kapit4n/inventory-nod.git            │
│  location: sibling directory of ng-vendei-full               │
│                                                              │
│  bin/www → app.js → 24 route modules                         │
│  routes/*.js      HTTP wiring only  ✔                        │
│  controllers/*.js  request/response mapping + query building │
│                    AND business logic                        │
│  lib/             the ONLY extracted logic:                  │
│                    inventory-stock-ops.js  (FEFO, lots)      │
│                    inventory-mutation-queue.js (SQLite lock) │
│  models/*.js      Sequelize models, used directly by         │
│                   controllers — no repository layer           │
│  ── NO services/  NO repositories/  NO domain/               │
└───────────────────────────┬──────────────────────────────────┘
                            │ Sequelize 6
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ SQLite — ./database.sqlite (1 MB, inside backend repo)      │
│  config/config.json: sqlite for development/test/production  │
│  WAL, busy_timeout=60000, pool.max=1, SQLITE_BUSY retry      │
│  migrations: 27 files (sequelize-cli)                       │
└──────────────────────────────────────────────────────────────┘
```

### Repository reality (differs from the task brief)

The brief assumed `frontend/` + `backend/` folders in one repository. They are not:

| Component     | Brief assumed            | Reality                                                                                                                                                                                   |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend      | `frontend/` in this repo | This repo (`ng-vendei-full`), Angular 21, at the **root** — there is no `src/app/core/` and no `api/` directory                                                                           |
| Backend       | `backend/` in this repo  | **Separate git repo** `inventory-nod`, a _sibling directory_ resolved at runtime by `scripts/resolve-inventory-backend-dir.sh`                                                            |
| Desktop shell | Tauri, in this repo      | **No Tauri exists.** `vendei-desktop` is a separate repo and is a **PySide6/Qt** app that does _not_ embed the Angular app; it reimplements POS against its own SQLite + SQLAlchemy stack |
| Tests         | —                        | Backend has a single script, `test/template-validation.js`; **no test runner and no `npm test`**                                                                                          |

Consequently Phases 4 (backend layering), 5 (database abstraction) and 7 (desktop)
have **no files inside this repository**. They are recorded as follow-up specs in
`target-architecture.md` rather than being faked here.

---

## 2. Where the frontend couples to the deployment

### 2.1 Environment / base URL

`src/environments/environment.ts` and `environment.prod.ts` each export a single field:

```ts
apiBaseUrl: ''; // dev  — same origin, relies on proxy.conf.json
apiBaseUrl: (window as any).__env?.apiBaseUrl ?? ''; // prod
```

It is read directly by four independent "config" services, each re-implementing
`baseUrl = environment.apiBaseUrl`:

| File                                             | Class                                                          |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `src/app/services/inv/i-config.service.ts:9`     | `IConfigService`                                               |
| `src/app/services/reg/r-config.service.ts:9`     | `RConfigService`                                               |
| `src/app/services/rep/rep-config.service.ts:9`   | `RepConfigService`                                             |
| `src/app/services/vendei/v-config.service.ts:19` | `VConfigService` (also holds `isTest`, card size, print flags) |

There is **no** `core/api/` layer. `src/app/interceptors/api.interceptor.ts` is
error normalisation only and deliberately does not prefix URLs (see its own comment
at line 7), so URL assembly is duplicated per service.

### 2.2 Hardcoded deployment assumptions (production blockers)

| Finding                                                         | Location                                                                                                                                                                                                                                                                                                                                                                                                                                        | Impact                                                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `window.__env` runtime override is documented but **dead code** | `environment.prod.ts:4-6`; `Dockerfile` copies only `nginx.conf`; no `env.js`, no runtime-config template, no compose file exists                                                                                                                                                                                                                                                                                                               | Production can never point at a different API host. Always same-origin.                     |
| **Bare collection requests are not proxied in production**      | `nginx.conf:12` — `location ~ ^/(products\|categories\|…)/ {` requires a **trailing slash**. Prod `apiBaseUrl` is `''`, so requests are `GET /products`, `GET /categories`, `GET /clients`, … — none match. They fall to `location /` → `try_files … /index.html` and return **HTML with HTTP 200** where JSON is expected. Sub-paths like `/orders/5` and `/products/upload-image` _do_ match, so the failure is partial and hard to diagnose. | Server mode is broken today for most endpoints.                                             |
| `/api` has no nginx location block                              | `nginx.conf`; consumed by `services/tools/backend-api-catalog.service.ts:64,70` (`/api/endpoints`, `/api/models`)                                                                                                                                                                                                                                                                                                                               | The Backend API browser page falls through to the SPA                                       |
| Hardcoded dev host baked into generated invoice HTML            | `pages/vendei/shopping-cart/pos-checkout.component.ts:122` — `src="http://localhost:4200/assets/vendei/print-logo.png"`                                                                                                                                                                                                                                                                                                                         | Receipt logo breaks for any non-localhost origin (i.e. all server deployments)              |
| `playwright.config.ts` hardcodes `http://localhost:4200`        | `playwright.config.ts:11,22`                                                                                                                                                                                                                                                                                                                                                                                                                    | E2E cannot target another host                                                              |
| `ARCHITECTURE.md` claims **PostgreSQL**                         | `ARCHITECTURE.md` technology table + diagram                                                                                                                                                                                                                                                                                                                                                                                                    | Documentation drift: the backend is SQLite in all three environments (`config/config.json`) |

### 2.3 Local filesystem / static-JSON "test mode"

`VConfigService.isTest` (`v-config.service.ts:10`, default `false`) switches several
services between the API and bundled JSON under `src/assets/vendei/`:

| Service                      | JSON path                       | File present? |
| ---------------------------- | ------------------------------- | ------------- |
| `v-products.service.ts:17`   | `assets/vendei/products.json`   | yes           |
| `v-customers.service.ts`     | `assets/vendei/customers.json`  | yes           |
| `v-orders.service.ts:11`     | `assets/vendei/orders.json`     | yes           |
| `v-categories.service.ts:12` | `assets/vendei/categories.json` | **MISSING**   |

`VCategoriesService.getAll` swallows the 404 via `catchError → of([])`
(`v-categories.service.ts:38-41`), so test mode silently yields an empty category list.

### 2.4 Browser / DOM coupling

`window` and `document` are used only in the printing path — legitimate browser
behaviour, but it is direct and unabstracted:

- `pos-checkout.component.ts:139,144-145,203` — `window.open` + `document.write` for the
  ad-hoc A4 print view
- `pos-checkout.component.ts:326,333-334` — `window.open` for the invoice receipt,
  with an `onafterprint` + `closed` polling fallback (`:346-353`)
- `pos-checkout.component.ts:179-191` — `window.matchMedia('print')`, `onbeforeprint`/`onafterprint`

`localStorage` is used in exactly one place: the active store-profile id
(`v-store-profile.service.ts:266,417`, key `activeStoreProfileId`).

**There is no `window.__TAURI__` usage and no desktop-capability code in the frontend.**

### 2.5 Authentication

`src/app/components/auth/login/login.component.ts` is an empty shell — empty
`ngOnInit`, no form, no API call. `guards/store-profile.guard.ts` is a `CanActivate`
that unconditionally `return true` and documents itself as a placeholder for future
auth. There is **no** user, role or permission model in either repository. `Cashier`
exists as a table but nothing authenticates against it.

---

## 3. Business logic that belongs in a service/domain layer

### 3.1 In the frontend (thin domain layer)

| Concern                                  | Location                                                                                | Notes                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Money rounding                           | `src/app/utils/money.ts` — `roundToCents`                                               | Pure, well tested                                                                                                             |
| Amount due / submit-readiness            | `src/app/utils/money.ts` — `orderAmountDue`, `isOrderReadyToSubmit`                     | Pure, well tested                                                                                                             |
| Inventory expiry (FEFO-adjacent display) | `src/app/utils/inv-expiry.ts` — `earliestOpenLotExpiry`, `daysFromTodayUtc`             | Display only; the real FEFO is server-side                                                                                    |
| Response envelope unwrapping             | `src/app/utils/api-body.ts` — `normalizeApiRecord`, `normalizeApiArray`                 | **Leaky**: encodes knowledge of Sequelize response shapes (`Client`, `ProductPresentation`, `data`, `rows`, …) in the browser |
| Report analytics                         | `src/app/utils/rep-sell-analytics.ts`, `rep-product-sales-analytics.ts`                 | Aggregation computed client-side over fetched rows                                                                            |
| Product card sizing                      | `src/app/services/vendei/v-store-profile.service.ts:21-24` — `normalizeCatalogCardSize` | Pure                                                                                                                          |

### 3.2 In the frontend — duplicated/mixed into UI

**`pages/vendei/shopping-cart/pos-checkout.component.ts` (508 lines) is the main
offender.** It holds a complete checkout use-case in a UI component:

| Logic                                            | Lines                                                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ticket total calculation                         | `91-101` `recalTotal()`                                                                                                                                                    |
| Payment/discount/return aggregation              | `415-430` `calTotals()`                                                                                                                                                    |
| Change due calculation                           | `429` `toReturn` (recomputed differently from `money.ts:orderAmountDue`)                                                                                                   |
| Order + order-detail assembly                    | `231-277` `buildOrderAndDetails()`                                                                                                                                         |
| Payment splitting into `paidCash` / `paidQr`     | `241-249`                                                                                                                                                                  |
| Store-profile FK stamping                        | `253-256`                                                                                                                                                                  |
| **Orchestration of the entire sale transaction** | `279-311` `saveOrder()` — POST order → for each detail POST orderDetail → then 3 parallel inventory calls (`reduceInventory`, `updateTotalSelled`, `updateQuantitySelled`) |
| Payment type state machine                       | `456-507` `removeItem` / `payIt`                                                                                                                                           |
| Profile-switch confirmation                      | `387-400`                                                                                                                                                                  |

The save pipeline at `282-302` is **not atomic**: the order, each line, and each stock
mutation are separate requests. A failure after `ordersSvc.save()` leaves a persisted
order with missing lines or unreduced stock. The only mitigation is on the server:
`lib/inventory-mutation-queue.js` serialises SQLite writes because _"the Angular POS
fires reduceInventory + updateTotalSelled + updateQuantitySelled in parallel per line"_.

`toReturn` (`429`) and `amountDue` (`442-444`) compute the same concept through two
different expressions — a latent divergence risk.

### 3.3 In the backend — controllers contain the business rules

Controllers query and write Sequelize models directly. There is no repository and no
service. Examples:

- `controllers/orders.js:4-31` — `pickOrderBody` (field coercion/whitelist) and
  `resolveCustomerIdForFk` (FK validation rule: the POS "Anonymous" id 1 often has no row)
- `controllers/orders.js:53-60` — `todaySummary` computes the day boundary in JS
- `controllers/products.js` — `reduceInventory` / `updateTotalSelled` /
  `updateQuantitySelled` are thin wrappers over `lib/inventory-stock-ops.js`

The only genuinely extracted domain logic is `lib/inventory-stock-ops.js`:
`receive`, `reduce` (FEFO lot consumption), `parseAmount`, `parseDateOnly`,
`resolveExpiryDate`. That file is **coupled to Sequelize and SQLite transactions** —
it uses `t.LOCK.UPDATE`, `InventoryLot.findAll`, and the in-process `runExclusive`
mutex, which are meaningless for PostgreSQL.

---

## 4. Data-access inventory (frontend)

27 files under `src/app/services/` inject `HttpClient`. Endpoints used:

| Resource                                | Base path                                                           | Also served as                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| products                                | `/products`                                                         | `?filter[where][productId]=`, `/reduceInventory`, `/updateTotalSelled`, `/updateQuantitySelled`, `/upload-image` |
| productPresentations                    | `/productPresentations`                                             | POS catalog source                                                                                               |
| categories                              | `/categories`                                                       | `?storeProfileId=`                                                                                               |
| clients                                 | `/clients`                                                          |                                                                                                                  |
| cashiers                                | `/cashiers`                                                         |                                                                                                                  |
| vendors                                 | `/vendors`                                                          |                                                                                                                  |
| unitOfMeasures                          | `/unitOfMeasures`                                                   |                                                                                                                  |
| orders                                  | `/orders`                                                           | `/today-summary`                                                                                                 |
| orderDetails                            | `/orderDetails`                                                     |                                                                                                                  |
| purchase-items                          | `/purchase-items`                                                   |                                                                                                                  |
| inventory-lots                          | `/inventory-lots`                                                   |                                                                                                                  |
| storeProfiles                           | `/storeProfiles`                                                    | `PUT /:id/default`                                                                                               |
| catalogTemplates                        | `/catalogTemplates`                                                 | `POST /:id/apply`                                                                                                |
| productAttributeDefinitions             | `/productAttributeDefinitions`                                      |                                                                                                                  |
| productAttributeValues                  | `/productAttributeValues`                                           |                                                                                                                  |
| productVariants                         | `/productVariants`                                                  |                                                                                                                  |
| ang-questions / ang-exams / ang-results | same                                                                |                                                                                                                  |
| uploads                                 | `/uploads/product-image` (multer alias of `/products/upload-image`) |                                                                                                                  |

**Sequelize query-string style leaks into the frontend**, e.g.
`filter[where][productId]=` (`services/inv/i-products-inv.service.ts:23`) and
`include[]=`/`orderBy[]=` in `services/rep/rep-sells.service.ts:32`.

Query strings are assembled by hand with template literals — no `HttpParams` —
e.g. `v-products.service.ts:52-53`, `i-products.service.ts:42`.

---

## 5. Multi-store / business-type model

`VStoreProfileService` (425 lines) is the single source of business-type behaviour:

- `StoreProfile` carries `businessType`, `currency`, `currencySymbol`, `locale`,
  `taxId`, `taxLabel`, `address`, plus a `posConfig` with `catalogColumns`,
  `showProductImages`, `quickProducts`, `defaultSellingMode`, `enabledPaymentTypes`,
  `respectStock`, `catalogCardSize`
- Active profile persisted to `localStorage` (`STORAGE_KEY = 'activeStoreProfileId'`)
  with fallback resolution + warning on unknown id (`v-store-profile.service.ts:180-186`)
- The default profile is persisted **server-side** (`PUT /storeProfiles/:id/default`)
  so it survives reload
- Business-type switching is `onProfileChanged` in the POS (`pos-checkout.component.ts:387-400`),
  which confirms with a dialog only if the ticket is non-empty

Multi-store is implemented as _profiles on one database_, with **no tenancy
boundary** — there is no per-profile data isolation, and no user/profile scoping.

---

## 6. Localisation

Angular `$localize` with `src/locale/` (es) and `src/messages.xlf`; `extract-i18n`
target exists in `angular.json` but is not wired into CI. Receipt/invoice rendering
uses `Intl` via `profileSvc.getLocale()` (default `es-BO`) rather than `$localize`.

---

## 7. Build, test and CI

| Concern        | Mechanism                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev server     | `ng serve` with `proxy.conf.json` → 22 path prefixes to `http://127.0.0.1:3000` (hardcoded, not env-driven)                                                                                                   |
| Prod build     | `ng build --configuration production`; only difference from dev is the `environment.ts → environment.prod.ts` file replacement plus optimisations                                                             |
| Container      | `Dockerfile` — node:22-alpine build → nginx:1.27-alpine serving `dist/`                                                                                                                                       |
| CI             | `.github/workflows/test.yml` — `npm ci`, then `ng test --watch=false --browsers=ChromeHeadless --code-coverage` (Node 18 & 20), then `npx playwright test`. **No `ng build`, no `ng lint`, no backend test.** |
| Unit tests     | Jasmine + Karma, `ChromeHeadless`. 62 `*.spec.ts` files                                                                                                                                                       |
| E2E            | Playwright, `testDir: e2e/playwright`                                                                                                                                                                         |
| Coverage gates | `src/karma.conf.js` thresholds — statements 80 / branches 70 / functions 80 / lines 80. Only enforced if `--code-coverage` is passed (CI does pass it)                                                        |
| Lint           | `@angular-eslint` v22 + flat config `eslint.config.js`; `ng lint` exists in `package.json` but **is not run in CI**                                                                                           |
| Format         | Prettier, `format:check` script exists, **not run in CI**                                                                                                                                                     |

Existing meaningful test coverage relevant to this refactor:

- `pages/vendei/shopping-cart/pos-checkout.integration.spec.ts` — checkout flow
- `pages/vendei/shopping-cart/pos-checkout.failure.spec.ts` — failure paths
- `app/utils/money.spec.ts` — money rules
- `app/utils/inv-expiry.spec.ts` — expiry helpers
- `services/vendei/v-store-profile.service.spec.ts` — multi-store/profile resolution
- `app/features/vendei/product-list/pos-catalog.integration.spec.ts` — catalog flow
- Per-service specs assert exact request URLs (e.g. `r-product.service.spec.ts`,
  `v-orders.service.spec.ts`) — these **pin the endpoint contract**, which is what
  makes the Phase 3 refactor safe.

---

## 8. Summary of coupling to remove

| #   | Coupling                                                 | Where                                                       | Target                                  |
| --- | -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| 1   | Four duplicate `baseUrl` config services                 | `*/[irv]-config.service.ts`                                 | one `AppConfigService`                  |
| 2   | No runtime configuration                                 | `environment*.ts`, dead `window.__env`                      | real runtime config loader              |
| 3   | Every service hand-builds URLs                           | 27 services                                                 | `core/api/*` client layer               |
| 4   | Hand-built query strings; Sequelize dialect leaks        | `i-products-inv`, `rep-sells`, `v-products`                 | `HttpParams` + DTOs                     |
| 5   | Sequelize response-shape knowledge in the browser        | `utils/api-body.ts`, inline `normalizeList` closures        | typed API contracts                     |
| 6   | Full checkout use-case in a component                    | `pos-checkout.component.ts`                                 | extract to a POS service                |
| 7   | `toReturn` vs `orderAmountDue` divergence                | `pos-checkout.component.ts:429` vs `utils/money.ts`         | one rule                                |
| 8   | Hardcoded `localhost:4200` in receipt HTML               | `pos-checkout.component.ts:122`                             | asset URL from app base                 |
| 9   | nginx does not proxy bare collection paths               | `nginx.conf:12`                                             | server mode works                       |
| 10  | `window`/`document` printing used directly               | `pos-checkout.component.ts`                                 | behind a `PrintService`                 |
| 11  | `localStorage` used directly                             | `v-store-profile.service.ts`                                | behind storage abstraction              |
| 12  | Business logic in backend controllers, coupled to SQLite | `inventory-nod/controllers/*`, `lib/inventory-stock-ops.js` | services + repositories (separate repo) |

Items 1-11 are actionable **in this repository**. Item 12 requires changes in
`inventory-nod` and is specified, not implemented, here.
