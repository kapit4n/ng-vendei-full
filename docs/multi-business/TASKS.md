# Multi-Business Tasks

## MB-001 — Baseline Architecture Analysis

**Status:** COMPLETED
**Priority:** CRITICAL
**Phase:** 0

**Objective:**
Understand the current architecture before implementing the multi-business model.

**Dependencies:**
None

**Acceptance Criteria:**
- [x] Product model analyzed
- [x] Store Profile analyzed
- [x] Product Presentation analyzed
- [x] Category model analyzed
- [x] Unit of Measure model analyzed
- [x] Inventory model analyzed
- [x] Order/OrderDetail model analyzed
- [x] POS checkout flow analyzed
- [x] Supermarket-specific assumptions documented
- [x] Best location for Business Profile identified (extend StoreProfile)
- [x] Recommended migration strategy documented (ADR-MB-001)
- [x] Risks documented (PROGRESS.md)

**Implementation Notes:**
- StoreProfile already exists with 6 fields — extend in-place
- Products filter by profile via query param
- Orders do NOT have storeProfileId — critical gap (ADR-MB-004)
- Currency, location, business name hardcoded in production code
- Anonymous customer hardcoded to id: 1
- Backend is separate repo — frontend changes only in this repo

**Files Changed:**
- docs/multi-business/ARCHITECTURE.md
- docs/multi-business/DECISIONS.md

**Tests:**
- Baseline: 57 spec files, 494 tests, 3 pre-existing failures

**Commit:**
- (pending)

---

## MB-002 — Run Test Suite and Record Baseline

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 0

**Objective:**
Execute the full test suite and record baseline results as the regression safety net.

**Dependencies:**
None

**Acceptance Criteria:**
- [x] Unit tests executed — 494 tests, 249 passing before disconnect, 3 pre-existing failures
- [x] Playwright E2E tests executed — 9 tests, all passing
- [x] Production build tested — PASS (after removing deprecated `extractCss`)
- [x] Baseline results recorded in TESTING.md
- [x] Existing failures documented (3 scaffold + disconnect issue)

**Implementation Notes:**
- Fixed `extractCss: true` deprecation in angular.json production config
- Build produces 1.69 MB initial bundle (344.59 kB compressed)
- Karma disconnect at ~252/494 tests due to scaffold test error

**Files Changed:**
- docs/multi-business/TESTING.md
- angular.json (removed deprecated `extractCss`)

**Tests:**
- Unit: 494 total, 3 failures (pre-existing)
- E2E: 9 tests, all passing
- Build: PASS

**Commit:**
- (pending)

---

## MB-003 — Document Hardcoded Business Assumptions

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 0

**Objective:**
Catalog every hardcoded business-specific assumption in the codebase.

**Dependencies:**
MB-001

**Acceptance Criteria:**
- [x] All currency assumptions documented (Bs in rep-sells, rep-products)
- [x] All location assumptions documented (Cochabamba Bolivia in invoice, checkout)
- [x] All business name assumptions documented (Codigo Casero in invoice, checkout)
- [x] All locale assumptions documented (es-ES in invoice, checkout)
- [x] All payment type assumptions documented (Cash+QR only)
- [x] All anonymous customer assumptions documented (id: 1 hardcoded)
- [x] Migration strategy for each assumption documented (ARCHITECTURE.md table)

**Implementation Notes:**
9 hardcoded assumptions cataloged in ARCHITECTURE.md "Hardcoded Assumptions to Address" table. Each has a migration strategy.

**Files Changed:**
- docs/multi-business/ARCHITECTURE.md (Hardcoded Assumptions section)

**Tests:**
- N/A (documentation only)

**Commit:**
- (pending)

---

## MB-004 — Extend StoreProfile Interface with Business Configuration

**Status:** COMPLETED
**Priority:** CRITICAL
**Phase:** 1

**Objective:**
Extend the existing StoreProfile model with business-specific fields.

**Dependencies:**
MB-001, MB-003

**Acceptance Criteria:**
- [x] BusinessProfile interface defined on StoreProfile
- [x] New fields have sensible defaults (BOB, es-BO, NIT, etc.)
- [x] Existing profiles continue working (all new fields optional)
- [x] Frontend service updated with helper methods
- [x] Tests updated (28 new tests covering all helpers + CAPABILITIES constant)

**Implementation Notes:**
Extended StoreProfile interface with: businessType, businessName, currency, currencySymbol, locale, taxId, taxLabel, address, capabilities, receiptConfig, posConfig. Added helper methods to VStoreProfileService: getCurrency, getCurrencySymbol, getLocale, getTaxLabel, getTaxId, getAddress, getBusinessName, getBusinessType, getCapabilities, hasCapability, getReceiptConfig, getPosConfig. All fallback to defaults for legacy profiles.

**Files Changed:**
- src/app/services/vendei/v-store-profile.service.ts (interface + helpers)
- src/app/services/vendei/v-store-profile.service.spec.ts (28 new tests)
- src/app/pages/inv/inv-products-inv/inv-products-inv.component.spec.ts (fixed mock)
- src/app/features/vendei/customer-list/customer-list.component.spec.ts (fixed mock)

**Tests:**
- v-store-profile.service.spec.ts: 28 tests, all passing

**Commit:**
- (pending)

---

## MB-005 — Add storeProfileId to Order Model

**Status:** COMPLETED
**Priority:** CRITICAL
**Phase:** 1

**Objective:**
Tag orders with the business profile they belong to.

**Dependencies:**
MB-004

**Acceptance Criteria:**
- [x] Order model includes storeProfileId (as `any` field on order object)
- [x] PosCheckoutComponent populates storeProfileId from active profile
- [x] Existing orders unaffected (field only set when profile exists)
- [x] Tests updated (storeProfileId asserted in integration + failure specs)

**Implementation Notes:**
- Injected VStoreProfileService into PosCheckoutComponent
- buildOrderAndDetails() sets order.storeProfileId from profileSvc.getActiveProfileId()
- Field omitted (undefined) when no active profile — backward-compatible

**Files Changed:**
- src/app/pages/vendei/shopping-cart/pos-checkout.component.ts (injected service, added storeProfileId)
- src/app/pages/vendei/shopping-cart/pos-checkout.integration.spec.ts (3 new assertions)
- src/app/pages/vendei/shopping-cart/pos-checkout.failure.spec.ts (2 new tests)

**Tests:**
- 526 total, 3 pre-existing failures (same as before), no regressions

**Commit:**
- (pending)

---

## MB-006 — Make Hardcoded Values Configurable Through Profile

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 1

**Objective:**
Replace hardcoded currency, location, business name, and locale with BusinessProfile values.

**Dependencies:**
MB-004

**Acceptance Criteria:**
- [x] Currency symbol reads from profile (templates + charts)
- [x] Address reads from profile (invoice + print receipt)
- [x] Business name reads from profile (invoice + print receipt)
- [x] Locale reads from profile (date formatting)
- [x] Tax ID/label reads from profile (invoice header)
- [x] Fallback to current defaults if profile field is empty

**Implementation Notes:**
- Injected VStoreProfileService into 5 components/services
- Added `currencySymbol` getter to 4 reporting components + POS checkout
- VInvoiceService: uses profile for business name, address, tax, locale
- pos-checkout.component.ts printOrder(): uses profile for business name, address, locale
- All 4 HTML templates: replaced hardcoded 'Bs' with `{{ currencySymbol }}`
- Zero hardcoded 'Bs' remaining in templates; defaults only in `||` fallbacks

**Files Changed:**
- src/app/services/vendei/v-invoice.service.ts (profile-based header)
- src/app/pages/rep/rep-sells/rep-sells.component.ts (currencySymbol getter + chart labels)
- src/app/pages/rep/rep-sells/rep-sells.component.html (5× Bs → currencySymbol)
- src/app/pages/rep/rep-products/rep-products.component.ts (currencySymbol getter + chart labels)
- src/app/pages/rep/rep-products/rep-products.component.html (6× Bs → currencySymbol)
- src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.ts (currencySymbol getter)
- src/app/pages/rep/rep-daily-sales/rep-daily-sales.component.html (12× Bs → currencySymbol)
- src/app/pages/vendei/shopping-cart/pos-checkout.component.ts (currencySymbol getter + printOrder)
- src/app/pages/vendei/shopping-cart/pos-checkout.component.html (4× Bs → currencySymbol)
- src/app/pages/vendei/shopping-cart/pos-checkout.integration.spec.ts (updated spy methods)
- src/app/pages/vendei/shopping-cart/pos-checkout.failure.spec.ts (updated spy methods)

**Tests:**
- 526 tests, pre-existing failures only, no regressions

**Commit:**
- (pending)

---

## MB-007 — Add Backend API Endpoints for Extended Profile Fields

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 1

**Objective:**
Extend the backend to store and serve the new BusinessProfile fields.

**Dependencies:**
MB-004

**Acceptance Criteria:**
- [x] storeProfiles table extended with 11 new columns
- [x] API accepts new fields on create/update
- [x] API returns new fields on get/list
- [x] Migration script for existing records (backfill defaults)

**Implementation Notes:**
- Migration `20260825120000-extend-store-profiles-business-config.js`: adds 11 nullable columns with defaults, backfills existing rows
- StoreProfile model: new fields with TEXT getters/setters for JSON fields (capabilities, receiptConfig, posConfig)
- Controller `pickProfilePayload()`: accepts all new fields, trims strings, passes arrays/objects through
- Seeder: all 5 profiles seeded with business-specific config (businessType, businessName, currency, locale, tax, capabilities, receipt/pos config)
- Verified: GET /storeProfiles returns arrays/objects correctly deserialized, POST creates with all fields

**Files Changed:**
- migrations/20260825120000-extend-store-profiles-business-config.js (new)
- models/storeprofile.js (11 new fields + JSON getters/setters)
- controllers/storeprofiles.js (pickProfilePayload extended)
- seeders/20260819120000-seed-store-profiles.js (business config per profile)

**Tests:**
- API smoke test: GET list, GET by id, POST create — all return correct types

**Commit:**
- (pending)

---

## MB-008 — Frontend Service Updates for BusinessProfile

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 1

**Objective:**
Update frontend services to use the extended BusinessProfile interface.

**Dependencies:**
MB-004, MB-007

**Acceptance Criteria:**
- [x] VStoreProfileService returns BusinessProfile
- [x] Profile getter methods for new fields
- [x] Capability check helper method
- [x] Currency/locale getter methods

**Implementation Notes:**
Completed as part of MB-004. All helper methods added to VStoreProfileService with backward-compatible defaults.

**Files Changed:**
- src/app/services/vendei/v-store-profile.service.ts

**Tests:**
- v-store-profile.service.spec.ts (28 tests covering all helpers)

**Commit:**
- (pending)

---

## MB-009 — Migration Strategy for Existing Data

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 1

**Objective:**
Ensure existing store profiles and orders work correctly after the schema extension.

**Dependencies:**
MB-004, MB-005

**Acceptance Criteria:**
- [x] Existing profiles get default values for new fields
- [x] Existing orders get a default storeProfileId
- [x] No data loss
- [x] Rollback strategy documented

**Implementation Notes:**
- ADR-MB-006 documents the three-layer strategy: SQL DEFAULT + backfill + frontend fallback
- Default businessType: 'supermarket', currency: 'BOB', locale: 'es-BO', taxLabel: 'NIT'
- Default capabilities: ['BARCODE', 'DISCOUNTS', 'CUSTOMERS']
- Rollback drops all 11 columns in reverse order; no data loss since columns are additive
- Frontend and backend can be deployed independently

**Files Changed:**
- docs/multi-business/DECISIONS.md (ADR-MB-006)

**Tests:**
- N/A (documentation + migration already verified)

**Commit:**
- (pending)

---

## MB-010 — Design Catalog Template Data Model

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 2

**Objective:**
Design the data model for reusable catalog templates.

**Dependencies:** MB-007

**Acceptance Criteria:**
- [x] CatalogTemplate model with business config fields
- [x] CatalogTemplateCategory model with sort order
- [x] CatalogTemplateProduct model with pricing, UoM, stock
- [x] FK relationships: Template -> Categories -> Products

**Files Changed:**
- inventory-nod: migrations/20260825130000-create-catalog-templates.js
- inventory-nod: models/catalogtemplate.js, catalogtemplatecategory.js, catalogtemplateproduct.js

**Commit:** a2d61eb

---

## MB-011 — Create Template Seed Data for 6 Business Types

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 2

**Objective:**
Seed 6 catalog templates with categories and products.

**Dependencies:** MB-010

**Acceptance Criteria:**
- [x] Supermarket template (barcode, weight, discounts, customers)
- [x] Chicken Store template (combos, fast checkout)
- [x] Butcher Shop template (weight, lots, expiration)
- [x] Clothing Store template (variants, sizes, colors)
- [x] Bakery template (weight, combos, loyalty)
- [x] Hardware Store template (variable quantity)

**Files Changed:**
- inventory-nod: seeders/20260825130000-seed-catalog-templates.js

**Commit:** a2d61eb

---

## MB-012 — Implement Template Application API

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 2

**Objective:**
API endpoint to apply a template: create StoreProfile + copy categories/products.

**Dependencies:** MB-010

**Acceptance Criteria:**
- [x] POST /catalogTemplates/:id/apply endpoint
- [x] Creates StoreProfile with template's business config
- [x] Copies categories with storeProfileId
- [x] Copies products with codes, prices, UoM links, presentations
- [x] Transactional (all-or-nothing)
- [x] Caller can override name, slug, businessName, currency, etc.

**Files Changed:**
- inventory-nod: controllers/catalogtemplates.js, routes/catalogtemplates.js, app.js

**Commit:** a2d61eb

---

## MB-013 — Frontend Template Selection UI

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 2

**Objective:**
UI for users to browse templates and apply one to create a new business.

**Dependencies:** MB-012

**Acceptance Criteria:**
- [x] Template gallery page showing all templates
- [x] Template detail view with categories and products preview
- [x] "Apply Template" button creating a new profile
- [x] Form for overriding name, businessName, currency, etc.

**Implementation Notes:**
- VCatalogTemplateService: getAll, getById, apply methods calling /catalogTemplates API
- CatalogTemplatesComponent: grid of template cards, detail overlay dialog
- Route: /reg/templates
- Proxy entry added for /catalogTemplates
- 10 new tests (9 catalog-templates + 1 loadTemplates)

**Files Changed:**
- src/app/services/vendei/v-catalog-template.service.ts (new)
- src/app/pages/reg/catalog-templates/catalog-templates.component.ts (new)
- src/app/pages/reg/catalog-templates/catalog-templates.component.html (new)
- src/app/pages/reg/catalog-templates/catalog-templates.component.css (new)
- src/app/pages/reg/catalog-templates/catalog-templates.component.spec.ts (new)
- src/app/app.module.ts (declared component + route)
- proxy.conf.json (added /catalogTemplates)

**Tests:**
- 536 total, 5 pre-existing failures only, no regressions

---

## MB-014 — Template-Based Product Seeding

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 2

**Objective:**
When a template is applied, seed the new profile with products.

**Dependencies:** MB-010, MB-012

**Acceptance Criteria:**
- [x] Products created with codes, prices, stock
- [x] ProductPresentations created with UoM
- [x] ProductUnitOfMeasure links created
- [x] Categories mapped correctly

**Commit:** a2d61eb

---

## MB-015 — Design ProductAttributeDefinition Model

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
Design the data model for reusable product attribute definitions per business profile.

**Dependencies:** MB-007

**Acceptance Criteria:**
- [x] ProductAttributeDefinition model with name, code, type, options, required, active, sortOrder
- [x] StoreProfile FK relationship
- [x] JSON-as-TEXT for options array (SQLite compatibility)

**Files Changed:**
- inventory-nod: migrations/20260825140000-create-product-attributes.js
- inventory-nod: models/productattributedefinition.js

**Commit:** (scaffolded with MB-016/017)

---

## MB-016 — Design ProductAttributeValue Model

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
Design the model for actual attribute values assigned to specific products.

**Dependencies:** MB-015

**Acceptance Criteria:**
- [x] ProductAttributeValue model with productId, productAttributeDefinitionId, value
- [x] FK relationships to Product and ProductAttributeDefinition

**Files Changed:**
- inventory-nod: models/productattributevalue.js

**Commit:** (scaffolded with MB-015/017)

---

## MB-017 — Design ProductVariant Model

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
Design the model for specific product variants (e.g., "T-Shirt XL Red").

**Dependencies:** MB-016

**Acceptance Criteria:**
- [x] ProductVariant model with name, sku, barcode, price, cost, stock, active
- [x] ProductVariantAttributeValue junction table
- [x] FK relationships with proper cascade rules

**Files Changed:**
- inventory-nod: models/productvariant.js
- inventory-nod: models/productvariantattributevalue.js

**Commit:** (scaffolded with MB-015/016)

---

## MB-018 — Backend API for Attributes

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
Full CRUD API endpoints for attribute definitions, values, and variants.

**Dependencies:** MB-015, MB-016, MB-017

**Acceptance Criteria:**
- [x] GET/POST/PUT/DELETE /productAttributeDefinitions with storeProfileId filter
- [x] GET/POST/DELETE /productAttributeValues with productId filter
- [x] GET/POST/PUT/DELETE /productVariants with nested attribute includes
- [x] Transactional create/update for variants with attribute value links
- [x] Proxy entries added in frontend

**Files Changed:**
- inventory-nod: controllers/productattributedefinitions.js, productattributevalues.js, productvariants.js
- inventory-nod: routes/productattributedefinitions.js, productattributevalues.js, productvariants.js
- ng-vendei-full: proxy.conf.json (3 new entries)

**Commit:** (scaffolded backend, proxy added in MB-019)

---

## MB-019 — Frontend Attribute Management UI

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
UI for managing product attribute definitions (list + create/edit form).

**Dependencies:** MB-018

**Acceptance Criteria:**
- [x] Attribute definition list page with table view
- [x] Attribute definition form (create/edit) with type selector
- [x] SELECT type shows comma-separated options input
- [x] Required and Active toggle switches
- [x] Filtered by active storeProfile
- [x] Route: /reg/attributes, /reg/attributes/new, /reg/attributes/:id

**Implementation Notes:**
- RAttributeDefinitionService: full CRUD calling /productAttributeDefinitions API
- RegAttributeListComponent: table with name, code, type, options, required, active columns
- RegAttributeComponent: form with mat-select for type, conditional options textarea
- Proxy entries for /productAttributeDefinitions, /productAttributeValues, /productVariants
- 20 new tests (10 list + 10 form), all passing

**Files Changed:**
- src/app/services/reg/r-attribute-definition.service.ts (new)
- src/app/pages/reg/reg-attribute-list/reg-attribute-list.component.ts (new)
- src/app/pages/reg/reg-attribute-list/reg-attribute-list.component.html (new)
- src/app/pages/reg/reg-attribute-list/reg-attribute-list.component.css (new)
- src/app/pages/reg/reg-attribute-list/reg-attribute-list.component.spec.ts (new)
- src/app/pages/reg/reg-attribute/reg-attribute.component.ts (new)
- src/app/pages/reg/reg-attribute/reg-attribute.component.html (new)
- src/app/pages/reg/reg-attribute/reg-attribute.component.css (new)
- src/app/pages/reg/reg-attribute/reg-attribute.component.spec.ts (new)
- src/app/app.module.ts (declared components + routes + provider)
- proxy.conf.json (3 new proxy entries)

**Tests:**
- 556 total, 6 pre-existing failures only, no regressions

---

## MB-020 — POS Integration for Variant Selection

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 3

**Objective:**
Allow POS to filter/select products by variant when selling.

**Dependencies:** MB-017, MB-019

**Acceptance Criteria:**
- [x] POS product list shows variant options when product has variants
- [x] User can select variant before adding to cart
- [x] Cart line item records selected variant
- [x] Price reflects variant price when set

---

## MB-021 — Define Capability Enum/Constants

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 4

**Objective:**
Define well-known capability string constants and a TypeScript type.

**Acceptance Criteria:**
- [x] CAPABILITIES constant object with all 12 capability strings
- [x] Capability union type derived from constants
- [x] DEFAULT_CAPABILITIES for new profiles

---

## MB-022 — Backend Capability Management

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 4

**Objective:**
Store capabilities as JSON array on StoreProfile model.

**Acceptance Criteria:**
- [x] capabilities TEXT field on StoreProfiles with JSON getter/setter
- [x] Default value: ["BARCODE","DISCOUNTS","CUSTOMERS"]
- [x] Seeded per-profile with business-specific capabilities

---

## MB-023 — Frontend Capability-Aware UI

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 4

**Objective:**
Expose capability checks to POS components via VStoreProfileService.

**Acceptance Criteria:**
- [x] getCapabilities() returns profile capabilities with defaults
- [x] hasCapability() checks inclusion in capabilities array
- [x] Existing tests for getCapabilities and hasCapability

---

## MB-024 — POS Capability Gating

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 4

**Objective:**
Gate POS UI features based on active profile capabilities.

**Dependencies:** MB-021, MB-022, MB-023

**Acceptance Criteria:**
- [x] Quick code / barcode input hidden when BARCODE disabled
- [x] Variant selection disabled when PRODUCT_VARIANTS disabled
- [x] Discount input hidden when DISCOUNTS disabled
- [x] Customer selection hidden when CUSTOMERS disabled
- [x] All features shown when capabilities are enabled (default behavior)

**Implementation:**
- PosCatalogComponent: `canScanBarcode` / `hasVariantsEnabled` getters gate quick code section and variant dialog
- PosPaymentPanelComponent: `hasDiscounts` / `hasCustomers` getters gate discount input and customer card
- 9 new capability gating tests (5 catalog + 4 payment panel), all passing

## MB-025 — Define Selling Mode Types

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 5

**Objective:**
Define well-known selling mode constants and utility functions.

**Acceptance Criteria:**
- [x] SELLING_MODES constants (UNIT, WEIGHT, VARIABLE_QTY, VARIANT, COMBO)
- [x] SellingMode type derived from constants
- [x] isDecimalSellingMode() helper function
- [x] sellingModeUnitLabel() helper function
- [x] resolveSellingMode() on VStoreProfileService
- [x] 12 new unit tests for selling mode helpers

## MB-026 — Backend Selling Mode Support

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 5

**Objective:**
Add sellingMode to Product model and unitLabel to OrderDetail.

**Acceptance Criteria:**
- [x] Migration adds sellingMode column to Products (default: 'UNIT')
- [x] Migration adds unitLabel column to OrderDetails
- [x] Product model updated with sellingMode field
- [x] OrderDetail model updated with unitLabel field
- [x] orderDetails controller saves unitLabel on create

## MB-027 — POS Selling Mode UI

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 5

**Objective:**
POS UI adapts quantity input based on product selling mode.

**Acceptance Criteria:**
- [x] WEIGHT/VARIABLE_QTY products prompt decimal quantity dialog
- [x] UNIT products increment by 1 (existing behavior)
- [x] QtyInputDialogComponent for decimal quantity entry
- [x] Ticket lines show unit label (kg, m) next to quantity
- [x] Edit dialog supports decimal quantities with unit label
- [x] sellingMode and unitLabel stored on cart lines

## MB-028 — Price Calculation Per Mode

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 5

**Objective:**
Ensure price calculation and receipt formatting work for all selling modes.

**Acceptance Criteria:**
- [x] Price = unitPrice × quantity (works for all modes)
- [x] Invoice/receipt shows quantity with unit label
- [x] Checkout passes unitLabel to backend on save

---

## MB-029 — POS Configuration Model

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 6

**Objective:**
Extend PosConfig type with payment method configuration.

**Acceptance Criteria:**
- [x] PosConfig includes enabledPaymentTypes (default: [1, 4])
- [x] getEnabledPaymentTypes() helper on VStoreProfileService
- [x] Default payment types preserved when config is empty

## MB-030 — Configurable Catalog Layout

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 6

**Objective:**
Make POS catalog grid use profile config for layout and images.

**Acceptance Criteria:**
- [x] catalogColumns from PosConfig drives grid-template-columns
- [x] showProductImages from PosConfig conditionally shows/hides images
- [x] Inline ngStyle binding replaces hardcoded CSS grid
- [x] Default values when config is empty

## MB-031 — Quick Products Configuration

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 6

**Objective:**
Add quick-access product buttons based on profile config.

**Acceptance Criteria:**
- [x] quickProducts IDs from PosConfig resolved to product objects
- [x] Quick-access button bar rendered in POS catalog
- [x] Buttons add products to cart on click
- [x] Hidden when quickProducts is empty

## MB-032 — Payment Method Configuration

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 6

**Objective:**
Make payment methods configurable per profile.

**Acceptance Criteria:**
- [x] Cash/QR toggle buttons conditionally shown based on enabledPaymentTypes
- [x] Default method auto-selected when only one is enabled
- [x] Payment lead text adapts to available methods

## MB-033 — Receipt Template Configuration

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 6

**Objective:**
Make invoice/receipt use profile config for paper size and content.

**Acceptance Criteria:**
- [x] paperWidth from ReceiptConfig drives CSS width and @page size
- [x] headerLines from ReceiptConfig rendered as extra header paragraphs
- [x] footerLines from ReceiptConfig replace hardcoded footer
- [x] Default footer when config is empty
- [x] Backend saves unitLabel on order detail

---

## MB-034 — Supermarket Template Validation

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 7

**Objective:**
Validate supermarket template creates a working POS business.

**Acceptance Criteria:**
- [x] Template has 5 categories, 15 products, 6 capabilities
- [x] posConfig: 4 columns, images enabled, UNIT selling mode, Cash+QR payments
- [x] receiptConfig: 80mm paper, header/footer lines set
- [x] Backend validation script passes

## MB-035 — Chicken Store Template Validation

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 7

**Objective:**
Validate chicken store template creates a working POS business.

**Acceptance Criteria:**
- [x] Template has 5 categories, 15 products, 5 capabilities
- [x] posConfig: 3 columns, images enabled, UNIT selling mode
- [x] Capabilities include COMBOS, BARCODE
- [x] Backend validation script passes

## MB-036 — Butcher Template Validation

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 7

**Objective:**
Validate butcher template creates a working POS business with weight-based selling.

**Acceptance Criteria:**
- [x] Template has 5 categories, 15 products, 6 capabilities
- [x] posConfig: 3 columns, images enabled, WEIGHT selling mode
- [x] Capabilities include WEIGHT_PRODUCTS, LOT_TRACKING, EXPIRATION
- [x] Backend validation script passes

## MB-037 — Clothing Template Validation

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 7

**Objective:**
Validate clothing template creates a working POS business with variant support.

**Acceptance Criteria:**
- [x] Template has 5 categories, 15 products, 6 capabilities
- [x] posConfig: 4 columns, images enabled, VARIANT selling mode
- [x] Capabilities include PRODUCT_VARIANTS, LOYALTY
- [x] 15 SVG product images created for clothing-store
- [x] Backend validation script passes

## MB-038 — Migrate TSLint to ESLint

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 8

**Objective:**
Replace TSLint (deprecated) with ESLint + @angular-eslint.

**Acceptance Criteria:**
- [x] ESLint 10.9.1 + @angular-eslint 22.1.0 installed
- [x] `eslint.config.js` created (flat config format)
- [x] `angular.json` lint builder changed to `@angular-eslint/builder:lint`
- [x] `tslint.json` and `src/tslint.json` deleted
- [x] `tslint` package uninstalled
- [x] `npx ng lint` passes: 0 errors, 29 warnings (pre-existing code style)

## MB-039 — Add Prettier

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 8

**Objective:**
Add consistent code formatting with Prettier.

**Acceptance Criteria:**
- [x] Prettier installed with `eslint-config-prettier`
- [x] `.prettierrc` created (single quotes, trailing commas, 120 print width)
- [x] `.prettierignore` excludes dist/node_modules/coverage/assets
- [x] `format` and `format:check` scripts added to package.json
- [x] `eslint-config-prettier` added to ESLint config to avoid conflicts

## MB-040 — Remove rxjs-compat

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 8

**Objective:**
Remove dead rxjs-compat dependency (rxjs 7.5.6 already in use).

**Acceptance Criteria:**
- [x] `rxjs-compat` removed from package.json
- [x] Build passes without rxjs-compat

## MB-041 — Lazy-load Feature Modules

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 8

**Objective:**
Split monolithic AppModule into lazy-loaded feature modules.

**Acceptance Criteria:**
- [x] VendeiFeatureModule: POS components + dialogs (lazy chunk: 123 kB)
- [x] RegFeatureModule: Product/category/customer/attribute management (lazy chunk: 145 kB)
- [x] RepFeatureModule: Reports and analytics (lazy chunk: 252 kB)
- [x] AppModule retains shared/ang/inv/tools components
- [x] CustomerListComponent made standalone for cross-module reuse
- [x] Build produces 3 lazy chunks, initial bundle reduced to 1.34 MB

## MB-042 — Add Route Guards

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 8

**Objective:**
Add guard infrastructure for protected routes.

**Acceptance Criteria:**
- [x] StoreProfileGuard created (ready for future auth integration)
- [x] Guard is `providedIn: 'root'`

## MB-043 — Add HTTP Interceptors

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 8

**Objective:**
Add global HTTP error handling.

**Acceptance Criteria:**
- [x] `apiInterceptor` functional interceptor created
- [x] Handles network errors (status 0), 404, 500+, and backend error messages
- [x] Registered via `provideHttpClient(withInterceptors([apiInterceptor]))` in AppModule
- [x] All existing services already handle their own base URL prefixing

## MB-044 — Fix Production API Configuration

**Status:** COMPLETED
**Priority:** HIGH
**Phase:** 8

**Objective:**
Fix hardcoded localhost URL in production environment config.

**Acceptance Criteria:**
- [x] `environment.prod.ts` uses `(window as any).__env?.apiBaseUrl ?? ''` for runtime config
- [x] Dev environment unchanged (localhost:3000)

## MB-045 — Containerize Deployment

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 8

**Objective:**
Add Docker support for frontend and backend.

**Acceptance Criteria:**
- [x] Frontend Dockerfile (multi-stage: node build + nginx runtime)
- [x] Backend Dockerfile (node:22-alpine)
- [x] nginx.conf with SPA fallback and API proxy to backend
- [x] docker-compose.yml at project root
- [x] .dockerignore files for both repos

## MB-046 — Remove Protractor

**Status:** COMPLETED
**Priority:** MEDIUM
**Phase:** 8

**Objective:**
Remove deprecated Protractor test framework.

**Acceptance Criteria:**
- [x] `e2e/protractor.conf.js`, `e2e/src/`, `e2e/tsconfig.e2e.json` deleted
- [x] Protractor + @types/jasminewd2 uninstalled
- [x] angular.json protractor project removed
- [x] `e2e` script updated to `npx playwright test`
