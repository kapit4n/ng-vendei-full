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

| Component | Repository | Local path |
|---|---|---|
| Angular SPA | `ng-vendei-full` (**this repo**) | `.` |
| Node.js API | `inventory-nod` | `../inventory-nod` |
| Desktop shell | `vendei-desktop` — **PySide6/Qt, not Tauri** | `../vendei-desktop` |

The backend and the desktop shell are referenced only through
`scripts/resolve-inventory-backend-dir.sh`. **Phase 4 (backend layering), Phase 5
(database abstraction) and Phase 7 (desktop) therefore have no files in this
repository.** Per the agreed scope they are *specified* in `target-architecture.md`
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

| Check | Command | Result |
|---|---|---|
| Frontend build (prod) | `npx ng build --configuration production` | **PASS** (1.36 MB initial bundle; 3 non-fatal "unused in compilation" warnings) |
| Lint | `npx ng lint` | **PASS** — exit 0, 0 errors, **29 warnings** |
| Unit tests | `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` | **FAIL** — see below |
| E2E | `npx playwright test` (backend running on :3000) | **FAIL** — 19 passed, 1 failed |
| Prettier | `npm run format:check` | **FAIL** — 190 files unformatted (pre-existing; not run in CI) |
| Backend build | `npm start` in `../inventory-nod` | **PASS** — `GET /categories` → HTTP 200 |
| Backend tests | — | **N/A** — `inventory-nod` has no `npm test` script; only `test/template-validation.js`, a standalone script |

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
- [ ] **Phase 2** — Deployment-agnostic boundaries (defined by Phase 3/6/8 work)
- [ ] **Phase 3** — Frontend/API separation (`core/api` layer)
- [ ] **Phase 4** — Backend layering → **blocked: separate repository**
- [ ] **Phase 5** — Database abstraction → **blocked: separate repository**
- [ ] **Phase 6** — Deployment configuration
- [ ] **Phase 7** — Desktop compatibility → **blocked: no Tauri; spec only**
- [ ] **Phase 8** — Server compatibility / platform abstraction
- [ ] **Phase 9** — Preserve existing business features
- [ ] **Phase 10** — Tests
- [ ] **Phase 11** — Documentation

## Changes

### `c5ed258` — `docs(architecture): document current deployment architecture as inspected`

Baseline architecture document only. No source changes.
