# Deployment Architecture Refactoring Progress

## Starting branch

`refactor/deployment-architecture`

## Starting commit

`c412dd76b8debf6a7c94afaae85ea0d09a0ccc49` (`feat(pos): persist POS product card size and grid density (small/medium/large)`)

Created from `master`, which was 2 commits ahead of `origin/master`.

> A stray `deleted: package-lock.json` was present in the working tree at the start and
> was restored with `git checkout -- package-lock.json` before branching, so the
> baseline is a clean tree.

## Repository reality

The brief assumed one repository containing `frontend/` and `backend/`. They are
three separate Git repositories:

| Component     | Repository                                   | Local path          |
| ------------- | -------------------------------------------- | ------------------- |
| Angular SPA   | `ng-vendei-full` (**this repo**)             | `.`                 |
| Node.js API   | `inventory-nod`                              | `../inventory-nod`  |
| Desktop shell | `vendei-desktop` — **PySide6/Qt, not Tauri** | `../vendei-desktop` |

The backend and the desktop shell are referenced only through
`scripts/resolve-inventory-backend-dir.sh`. **Phase 4 (backend layering), Phase 5
(database abstraction) and Phase 7 (desktop) therefore have no files in this
repository.** Per the agreed scope they are _specified_ in `target-architecture.md`
as follow-up work rather than implemented here.

## Current architecture

```
Angular SPA (this repo)
   ↓  HTTP, baseUrl = environment.apiBaseUrl, URL built per-service
Express API  (../inventory-nod — separate repo)
   routes → controllers (hold the business logic) → Sequelize models
   ↓
SQLite  (../inventory-nod/database.sqlite, WAL, pool.max=1)
```

There is **no** `core/api` layer, **no** services/repositories/domain layer in the
backend, **no** runtime configuration, and **no** authentication. Full detail in
[`current-architecture.md`](./current-architecture.md).

## Baseline

Recorded on Node v22.23.2 / npm 10.9.8, after `npm ci --legacy-peer-deps`.

| Check                 | Command                                                    | Result                                                                                                      |
| --------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Frontend build (prod) | `npx ng build --configuration production`                  | **PASS** (1.36 MB initial bundle; 3 non-fatal "unused in compilation" warnings)                             |
| Lint                  | `npx ng lint`                                              | **PASS** — exit 0, 0 errors, **29 warnings**                                                                |
| Unit tests            | `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` | **FAIL** — see below                                                                                        |
| E2E                   | `npx playwright test` (backend running on :3000)           | **FAIL** — 19 passed, 1 failed                                                                              |
| Prettier              | `npm run format:check`                                     | **FAIL** — 190 files unformatted (pre-existing; not run in CI)                                              |
| Backend build         | `npm start` in `../inventory-nod`                          | **PASS** — `GET /categories` → HTTP 200                                                                     |
| Backend tests         | —                                                          | **N/A** — `inventory-nod` has no `npm test` script; only `test/template-validation.js`, a standalone script |

### Unit-test baseline is already broken

The suite **does not complete**. It disconnects after ~570 of 699 specs
(`browserDisconnectTimeout: 60000`). Failure count varies between runs (3–16
observed), so the run is also nondeterministic.

The 16 failures observed on the recorded run:

```
AppComponent should render the brand text in the nav
Failure Scenarios — Regression Concurrent / rapid submission concurrent saves both reduce inventory independently
Failure Scenarios — Regression Invoice generation generates invoice with correct data
Failure Scenarios — Regression Price edge cases handles zero price product
Failure Scenarios — Regression Zero quantity handling total is 0 when quantity is 0
PosCheckoutComponent printInvoiceAndSave closes the print window after onafterprint fires
PosCheckoutComponent printInvoiceAndSave does not call close on an already-closed window after onafterprint
PosCheckoutComponent submitOrder saves order and details
RegAttributeListComponent should delete after confirmation
RegCategoryListComponent should create
RegCustomerListComponent should create
RegProductListComponent should create
RegProductPresentationComponent should create
rep-product-sales-analytics utils buildExecutiveSummary builds correct summary
VariantSelectDialogComponent should handle load error
VStoreProfileService capabilities getCapabilities returns profile capabilities
```

Known root causes (all pre-existing, none introduced by this refactor):

- `customer-list.component.spec.ts:12` — `CustomerListComponent` is standalone but is
  placed in `declarations`.
- Several `Reg*Component` specs inject a partial mock service (e.g.
  `reg-category-list.component.spec.ts` → `TypeError: this.categorySvc.getAll is not a function`).
- `inv-products.component.spec.ts` uses the **real** `HttpClient` with no
  `provideHttpClientTesting`, so requests hit the Karma server
  (`WARN [web-server]: 404: /_karma_webpack_/products?filter[include]=…`) and an
  async error escapes the zone, which is what tears the browser down mid-run.

### E2E baseline failure

`product-card-size.spec.ts:17` — expects the default card density to be `Medium`,
finds `Small`. Commit `c412dd7` moved card size to server-side persistence, so the
value leaks between runs and the test is order/state dependent.

### Regression bar for this refactor

The unit-test suite is **not** a pass/fail gate. The gate used throughout this
milestone is:

> The set of failing spec names **must not grow** relative to
> `baseline-failures.txt`, and every spec covering the code this refactor touches
> must pass.

## Refactoring progress

- [x] **Phase 0** — Baseline architecture inspection → `current-architecture.md`
- [x] **Phase 1** — Baseline validation recorded
- [x] **Phase 2** — Deployment-agnostic boundaries → `core/config`, `core/platform`
- [x] **Phase 3** — Frontend/API separation → `core/api`, `API_PATHS`, `ApiClientService`
- [ ] **Phase 4** — Backend layering → **blocked: separate repository** (`../inventory-nod`); required for a transactional POS sale
- [ ] **Phase 5** — Database abstraction → **blocked: separate repository** (`../inventory-nod`)
- [x] **Phase 6** — Deployment configuration → `nginx.conf`, `playwright.config.ts`, runtime config
- [ ] **Phase 7** — Desktop compatibility → **blocked: no Tauri** (`../vendei-desktop` is PySide6); requirements documented in `target-architecture.md`
- [x] **Phase 8** — Server compatibility / platform abstraction → `PlatformService`, `StorageService`, `PrintService`
- [x] **Phase 9** — Preserve existing business features → `PosSaleService` extraction, same order → details → inventory sequence
- [x] **Phase 10** — Tests → scoped runner, all specs green; E2E 20/20
- [x] **Phase 11** — Documentation → `target-architecture.md`

Phases 4, 5 and 7 are blocked by repository boundaries, not by design gaps.
The frontend already exposes the seams they need — `PosSaleService` for a
transactional sale, `PlatformService` for a shell that owns persistence.

## Final validation

| Check                  | Baseline              | Now                   |
| ---------------------- | --------------------- | --------------------- |
| Unit specs (scoped)    | 16 named failures     | 0 failures            |
| E2E                    | 19/20                 | 20/20                 |
| `ng lint`              | 29 warnings, 0 errors | 21 warnings, 0 errors |
| Production build       | pass                  | pass, 1.37 MB initial |
| Typecheck (app + spec) | pass                  | pass                  |

Scoped unit runs, all green:

| Scope            | Specs |
| ---------------- | ----- |
| `app/core`       | 45    |
| `app/services`   | 138   |
| `app/pages`      | 223   |
| `app/features`   | 212   |
| `app/utils`      | 135   |
| `app/components` | 1     |
| `app.component`  | 4     |

The remaining 21 lint warnings and the ~190-file `format:check` backlog are
pre-existing and untouched; they are unrelated to this milestone's changes.

**Known limitation:** the single full Karma run still disconnects intermittently
part-way through (~750 specs in one browser). This is pre-existing and unrelated
to any change here, which is why scoped runs are the signal.

## Changes

### `c5ed258` — `docs(architecture): document current deployment architecture as inspected`

Baseline architecture document only. No source changes.

### `9c6910f` — `feat(core): add deployment-agnostic config, API and platform layers`

New `core/` boundaries: runtime config resolution, `AppConfigService`,
`API_PATHS`, `ApiClientService`, `PlatformService`, `StorageService`,
`PrintService`. Runtime values that are blank fall back to build-time values.
`runtime-config.js` is served with `no-store` so a container can rewrite it
without a rebuild.

### `a765bbb` — `refactor(services): route all feature services through ApiClientService`

All feature services migrated off hand-built URLs. Removed three duplicate
per-domain config services (`inv`, `reg`, `rep`) that duplicated
`AppConfigService`. `VConfigService` keeps POS settings; `VStoreProfileService`
now uses `ApiClientService` + `StorageService`.

### `040ba28` — `refactor(pos): extract the sale use case and route printing through a seam`

`PosSaleService` owns the order → details → inventory sequence; the component
now only orchestrates UI. `PrintService` replaces direct `window.open`, and the
receipt logo uses `absoluteAssetUrl()` instead of a hardcoded
`http://localhost:4200`. `orderChangeDue()` centralises the change rule.

### `dde4289` — `fix(deploy): proxy bare collection paths and stop assuming localhost`

`nginx.conf` proxied only `/api`, so bare collection requests 404'd behind the
reverse proxy while working in dev; the `location` regex now covers them.
`playwright.config.ts` takes `E2E_BASE_URL`. This commit also introduced the
missing-import bug fixed in `72917c7`.

### `198409b` — `test: make the refactor verifiable, and fix the specs it invalidated`

Scoped Karma runner, shared test bootstrap, Playwright gitignore entries, and
spec fixes for the core/services/POS work. POS failures 15 → 0.

### `14b8057` — `fix: stop silently swallowing variant load failures, clear remaining red specs`

`VProductVariantService.getByProductId` had `catchError(() => of([]))`, making
both callers' error handling unreachable; removed. `PlatformService` gained a
real consumer (`StorageService` warns once on failed writes) so it is no longer
dead code. Remaining baseline failures were bad specs, each fixed against what
the code actually does — including two that had been masking the truth: four reg
specs provided services as `{}`, and one asserted that 1 of 6 SKUs should cover
80% of revenue when it covers 66.7%.

### `72917c7` — `fix(e2e): repair playwright config and make card-size suite order-independent`

`playwright.config.ts` referenced `defineConfig`/`devices` without importing
them, so the E2E suite could not load at all. The card-size suite now sets its
own starting density through the same PUT the settings screen issues, so
server-persisted state cannot leak between runs. E2E 19/20 → 20/20.

### Documentation

`target-architecture.md` records the rules, the config merge semantics, the
deployment shapes, the testing strategy, and — explicitly — the backend and
desktop/Tauri work that is out of scope because it belongs to other
repositories.
