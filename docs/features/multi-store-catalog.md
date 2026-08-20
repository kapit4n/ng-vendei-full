# Multi-Store Product Catalog Profiles

> **Status:** Complete (code done, migration + seed run, tests passing, build clean)
> **Date:** 2026-08-20

## Overview

The multi-store catalog feature allows the POS to switch between different store profiles (e.g., Supermarket, Chicken Store, Hardware Store, Auto Parts, Bakery). Each profile has its own set of categories and products, and switching profiles dynamically reloads the catalog.

## Architecture

### Backend (inventory-nod)

| Component | File | Description |
|-----------|------|-------------|
| Model | `models/storeprofile.js` | Sequelize model: name, slug, description, active, defaultProfile |
| Migration | `migrations/20260819120000-create-store-profiles.js` | Creates StoreProfiles table, adds storeProfileId FK to Products/Categories, backfills default profile |
| Controller | `controllers/storeprofiles.js` | Full CRUD: list, getById, create, update, delete |
| Routes | `routes/storeprofiles.js` | REST routes mounted at `/storeProfiles` |
| Seeder | `seeders/20260819120000-seed-store-profiles.js` | 5 profiles with 5 categories + 15 products each |
| App | `app.js` | Route mounted, `looksLikeApiRequest` regex updated |

**Modified controllers:**
- `controllers/products.js` — accepts `?storeProfileId=N` query param
- `controllers/categories.js` — accepts `?storeProfileId=N` query param
- `controllers/productPresentations.js` — accepts `?storeProfileId=N` (filters via Product join)

**Modified models:**
- `models/product.js` — added `belongsTo(StoreProfile)` + `storeProfileId` field
- `models/category.js` — added `belongsTo(StoreProfile)` + `storeProfileId` field

### Frontend (ng-vendei-full)

| Component | File | Description |
|-----------|------|-------------|
| Service | `services/vendei/v-store-profile.service.ts` | BehaviorSubject + localStorage persistence |
| Selector | `features/vendei/store-profile-selector/` | Material mat-select dropdown in POS toolbar |
| Dialog | `features/vendei/profile-switch-dialog/` | Confirmation dialog when switching with non-empty cart |

**Modified services:**
- `v-products.service.ts` — `getProducts(profileId?)` sends `?storeProfileId=N`
- `v-categories.service.ts` — `getAll(profileId?)` sends `?storeProfileId=N`

**Modified components:**
- `pos-catalog.component.ts` — reactively reloads products/categories on profile change via `switchMap`
- `pos-checkout.component.ts` — `onProfileChanged()` opens confirmation dialog, clears cart on confirm
- `pos-checkout.component.html` — profile selector in toolbar
- `app.module.ts` — declares new components, provides VStoreProfileService

## Seed Profiles

| Profile | Slug | Categories | Products | Price Range (Bs) |
|---------|------|-----------|----------|-----------------|
| Supermarket | supermarket | 5 | 15 | 3 - 25 |
| Chicken Store | chicken-store | 5 | 15 | 8 - 95 |
| Hardware Store | hardware | 5 | 15 | 3 - 65 |
| Auto Parts | auto-parts | 5 | 15 | 15 - 350 |
| Bakery | bakery | 5 | 15 | 3 - 18 |

## Data Flow

```
User selects profile → VStoreProfileService.setActiveProfile()
  → BehaviorSubject emits new profileId
  → PosCatalogComponent.switchMap() triggers forkJoin
  → VProductsService.getProducts(profileId) + VCategoriesService.getAll(profileId)
  → GET /productPresentations?storeProfileId=N + GET /categories?storeProfileId=N
  → Catalog grid re-renders with filtered results
```

## Verification

- [x] All 5 profiles seeded in database
- [x] Profile selector renders in POS toolbar
- [x] Switching profiles reloads products and categories
- [x] Search only finds products in active profile
- [x] Cart confirmation dialog appears on profile switch
- [x] Frontend build succeeds (`ng build`)
- [x] All multi-store tests pass
