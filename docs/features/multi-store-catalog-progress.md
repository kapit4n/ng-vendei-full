# Multi-Store Product Catalog Profiles — Implementation Plan

## Status
**COMPLETE** — All code written, migration run, seed applied, tests passing, build clean.

## Steps Completed

### Step 1 — Backend: Finish Domain Changes
- [x] Update `inventory-nod/models/category.js` — add `belongsTo(StoreProfile)` and `storeProfileId` field
- [x] Verify migration runs cleanly: `npx sequelize-cli db:migrate` ✅

### Step 2 — Backend: StoreProfile Controller + Routes
- [x] Create `inventory-nod/controllers/storeprofiles.js` — CRUD endpoints
- [x] Create `inventory-nod/routes/storeprofiles.js`
- [x] Mount route in `inventory-nod/app.js` — add `storeProfilesRouter` at `/storeProfiles`
- [x] Update `proxy.conf.json` in frontend — add `/storeProfiles` proxy entry
- [x] Update `app.js` `looksLikeApiRequest` regex to include `storeProfiles`

### Step 3 — Backend: Add Profile Filtering to Existing Endpoints
- [x] Modify `inventory-nod/controllers/productPresentations.js` — accept `?storeProfileId=N` query param, join Product, filter by `Product.storeProfileId`
- [x] Modify `inventory-nod/controllers/categories.js` — accept `?storeProfileId=N` query param, filter by `storeProfileId`
- [x] Modify `inventory-nod/controllers/products.js` — accept `?storeProfileId=N` query param

### Step 4 — Backend: Seed Data for 5 Profiles
- [x] Create `inventory-nod/seeders/20260819120000-seed-store-profiles.js` — 5 profiles, 25 categories, 75 products
- [x] Run seed: `npx sequelize-cli db:seed:all` ✅

### Step 5 — Frontend: StoreProfile Service
- [x] Create `src/app/services/vendei/v-store-profile.service.ts`
- [x] Create `src/app/services/vendei/v-store-profile.service.spec.ts`

### Step 6 — Frontend: Profile Selector Component
- [x] Create `src/app/features/vendei/store-profile-selector/` (ts, html, css, spec)
- [x] Register component in `app.module.ts` declarations

### Step 7 — Frontend: Wire Profile into Product/Category Loading
- [x] Modify `v-products.service.ts` — add optional `profileId` param to `getProducts()`
- [x] Modify `v-categories.service.ts` — add optional `profileId` param to `getAll()`
- [x] Modify `pos-catalog.component.ts` — inject `VStoreProfileService`, reload on profile change via switchMap
- [x] Modify `pos-checkout.component.ts` — add profile change handler

### Step 8 — Frontend: Cart/Profile Switching
- [x] Create `features/vendei/profile-switch-dialog/profile-switch-dialog.component.ts` — MatDialog confirmation
- [x] Clear cart on confirmed profile switch

### Step 9 — Frontend: Layout Integration
- [x] `pos-checkout.component.html` — add profile selector to toolbar
- [x] Product cards display correctly for all profiles

### Step 10 — Tests
- [x] `v-store-profile.service.spec.ts` — profile management, localStorage ✅
- [x] `store-profile-selector.component.spec.ts` — renders, emits changes ✅
- [x] `pos-catalog.component.spec.ts` — profile filtering tests ✅
- [x] `pos-checkout.component.spec.ts` — cart clearing on profile switch ✅
- [x] `ng build` — clean build ✅
- [x] `ng test` — all multi-store tests pass, only pre-existing failures remain ✅

### Step 11 — Documentation & Progress
- [x] Create `docs/features/multi-store-catalog.md`
- [x] Update `docs/features/multi-store-catalog-progress.md` (this file)

### Step 12 — Product Images (75 SVG catalog images)
- [x] Generated 75 SVG product images across 5 profiles via `scripts/generate-catalog-images.js`
- [x] Images stored in `src/assets/vendei/catalog/{profile-slug}/` (supermarket, chicken-store, hardware, auto-parts, bakery)
- [x] Added `productImgPath(profileSlug, productName)` helper in seeder for deterministic `assets/vendei/catalog/...` paths
- [x] Seeded all 75 products + presentations with `img` field pointing to their catalog SVGs
- [x] Added `onImageError()` fallback handler to `pos-ticket-lines.component.ts` — falls back to `PRODUCT_CARD_PLACEHOLDER`
- [x] Added `onImageError()` fallback handler to `reg-product-show.component.ts` — falls back to `PRODUCT_CARD_PLACEHOLDER`
- [x] Added `(error)="onImageError($event)"` to `<img>` tags in ticket lines and product show templates
- [x] Re-ran migration + seed: `db:migrate:undo` → `db:migrate` → `db:seed:all` ✅
- [x] `ng build` — clean ✅
- [x] `ng test` — no new failures ✅

## Known Issues
- Pre-existing test failures: `RegCategoryComponent`, `RegProductComponent`, `InvProductsInvComponent`, `AppComponent`, `RegCustomerComponent`, `RegProductPresentationComponent`, `CustomersDialogComponent`, `PosCheckoutComponent` (print/save/submit) — not related to this feature
- The `VInvoiceService` hardcodes "Codigo Casero" branding — could be made profile-aware later

## Steps Completed

### Step 1 — Backend: Finish Domain Changes

## Verification Summary
| Check | Status |
|-------|--------|
| Migration ran successfully | ✅ |
| Seed data loaded (5 profiles, 25 categories, 75 products with images) | ✅ |
| Backend `/storeProfiles` endpoint works | ✅ |
| Backend profile filtering on `/products` and `/categories` | ✅ |
| Frontend profile selector renders in POS toolbar | ✅ |
| Catalog reloads on profile switch | ✅ |
| Cart confirmation dialog works | ✅ |
| 75 SVG product images generated (5 profiles × 15 products) | ✅ |
| Product images seeded with `img` field on all products + presentations | ✅ |
| `<img>` error fallback handler on ticket lines + product show | ✅ |
| Frontend build succeeds | ✅ |
| All multi-store tests pass | ✅ |

---

## Commands Used

```bash
# Backend migrate + seed
cd /home/larce/Documents/proj/gi/inventory-nod
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Frontend tests
cd /home/larce/Documents/proj/gi/ng-vendei-full
npx ng test --watch=false

# Frontend build
npx ng build

# Regenerate product images
node scripts/generate-catalog-images.js

# Re-seed with images
cd /home/larce/Documents/proj/gi/inventory-nod
npx sequelize-cli db:migrate:undo && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all
```

*Last updated: 2026-08-20 (product images added)*
