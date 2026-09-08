# POS UI Recovery

Restores the degraded Vendei POS catalog layout while keeping the business/catalog
architecture introduced by the recent refactor. No part of the refactor was undone.

## Root cause

`.product-cards-box` (grid in `pos-catalog.component.css`) used the default
`align-items: stretch` row sizing. Cards are `display:flex; flex-direction:column`
with a `background-image` media div using `aspect-ratio:1/1` and `width:100%`.

Aspect-ratio-in-flex-column combined with stretched grid rows creates a circular
sizing dependency → rows collapsed to ~158px while real card content was ~309px.
`overflow:hidden` then clipped the card:

- images showed only the top third
- the name/price panel was pushed out of the visible area
- rows overlapped each other

Verified in the running app (Playwright): `clientHeight=158` vs `scrollHeight=309`.

## Fix

### 1. Real `<img>` product cards (`product-card/`)

- `ProductImageComponent` (`app-product-image`): renders a real `<img>` on a fixed
  square tile (`aspect-ratio:1/1`, `object-fit:contain`), with fallback to
  `assets/vendei/placeholders/product-card.svg` for empty/invalid URLs and
  `(error)` handling for broken assets. Predictable tile no matter the image.
- `ProductCardComponent` (`app-product-card`): business-agnostic card deriving
  name (title + parenthetical label), price (currency from profile), SKU, unit
  label (from suffix or `sellingMode`), and out-of-stock disabled state. Emits
  `addProduct`; accessible (button with `aria-label`, keyboard Enter/Space).

Registered in `vendei-feature.module.ts` declarations.

### 2. Grid fix (`pos-catalog.component.css`)

- New `.product-cards-grid` wrapper uses `align-items:start; align-content:start`
  with `repeat(<N>, 1fr)` columns driven by profile `catalogColumns`.
- Removed the collapsing `.product-list-item-t` inline card markup + media band.

Verified: cards now render at natural 311–318px height, `scrollHeight == clientHeight`
(no clipping).

### 3. Loading / empty / error states

- `loading` flag + shimmer skeleton grid while the initial catalog loads.
- Empty state ("No matches" / "No products") and error state with a Retry button
  (`retry()` re-runs the load). `loadError` + `skeletonCards()` on the component.

### 4. POS balance (`pos-checkout.component.*`)

- Payment panel is now collapsible (`.payment-toggle`), collapsed by default via
  `paymentCollapsed`. An empty ticket gets the vertical room (ticket measured
  116px → 376px at 1440×900); a "Due" badge shows when payments are outstanding.
- `selected-list-body` max height raised to `min(42vh, 360px)`.

## Regression coverage

- `product-card.component.spec.ts` — name/price/SKU/stock/disabled/emit/fallback.
- `product-image.component.spec.ts` — URL resolution + `(error)` fallback.
- `pos-catalog.integration.spec.ts` — new "Card layout regression" block asserting
  `app-product-card` renders, a real `<img>` is used, and grid `align-items:start`.
- `e2e/playwright/pos-catalog.spec.ts` — live browser guardrail: card not clipped,
  grid start alignment, `<img>` present, payment panel collapse/expand.

## Verification summary

- `ng build --configuration production` ✅
- ESLint: 0 errors (warnings pre-existing) ✅
- Karma: all new specs pass; only the documented pre-existing failures remain
  (AppComponent, PosCheckout print/submit, CustomerList, Reg*, etc.) — none from
  the changed files ✅
- `npx playwright test`: 14/14 pass ✅

## Component mapping

- `ProductCardComponent` → `features/vendei/product-card/product-card.component.*`
- `ProductImageComponent` → `features/vendei/product-card/product-image.component.*`
- Grid/empty/error/skeleton → `features/vendei/product-list/pos-catalog.component.*`
- Collapsible payment → `pages/vendei/shopping-cart/pos-checkout.component.*`
- `respectStock` PosConfig flag → `services/vendei/v-store-profile.service.ts`

## Default Business Configuration (Task #25)

The POS starts on a configured default business/catalog instead of a hardcoded one.
The default lives in the backend's `StoreProfile.defaultProfile` flag and is managed
from a new **Business settings** page (`/settings`, lazy `SettingsFeatureModule`,
reached from a hub tile on `/main`).

- Backend: `PUT /storeProfiles/:id/default` atomically clears `defaultProfile` on all
  profiles and sets it on the target (`storeprofiles.controller.js#setDefault`).
- Service (`services/vendei/v-store-profile.service.ts`):
  - `resolveInitialProfileId()` — startup resolution: a valid stored temporary
    selection wins, then the configured default (if active), then the first
    active profile, then the first profile, else `null`.
  - `mapFallbackReason()` — labelled fallback so a swallowed preference is visible
    in the console instead of silently ignored.
  - `setDefaultProfile(profile)` (PUT) updates the profiles cache only; it never
    touches the active-session state, so an open POS keeps its current session.
- UI (`pages/settings/business-settings/`): lists profiles, marks the current
  default, `[value]`/`(selectionChange)` mat-select, inline save feedback.
- The in-POS business switcher remains a **temporary, per-session** override; the
  UI copy and the service document that it does not overwrite the default.
- Note: components rendering after async HTTP call `ChangeDetectorRef.detectChanges()`
  (the app-wide pattern, cf. `pos-catalog.component.ts`) because several pages
  otherwise fail to refresh their view in headless environments.

## Verification summary (Task #25)

- `ng build --configuration production` ✅ (settings feature emitted as a lazy chunk)
- ESLint: 0 errors ✅
- Karma: 27 new tests (service + component) all pass; only the documented
  pre-existing failures remain ✅
- `npx playwright test`: 16/16 pass (including the two new business-settings specs) ✅
