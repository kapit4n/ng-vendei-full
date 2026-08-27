# Multi-Business Progress

Last Updated: 2026-08-27

Current Phase: Phase 8 (Complete)
In Progress: None (All Phases Complete)

Current Task: MB-046 COMPLETED — Phase 8 done

Overall Progress: 100%

## Completed

- MB-001: Baseline Architecture Analysis
- MB-002: Run Test Suite and Record Baseline
- MB-003: Document Hardcoded Business Assumptions
- MB-004: Extend StoreProfile Interface with Business Configuration
- MB-005: Add storeProfileId to Order Model
- MB-006: Make Hardcoded Values Configurable Through Profile
- MB-007: Backend API Endpoints for Extended Profile Fields
- MB-008: Frontend Service Updates for BusinessProfile (completed as part of MB-004/005)
- MB-009: Migration Strategy for Existing Data
- MB-010: Design Catalog Template Data Model
- MB-011: Create Template Seed Data for 6 Business Types
- MB-012: Implement Template Application API
- MB-013: Frontend Template Selection UI
- MB-014: Template-Based Product Seeding (completed as part of MB-012)
- MB-015: Design ProductAttributeDefinition Model
- MB-016: Design ProductAttributeValue Model (completed as part of MB-015)
- MB-017: Design ProductVariant Model (completed as part of MB-015)
- MB-018: Backend API for Attributes
- MB-019: Frontend Attribute Management UI
- MB-020: Template Attribute Mapping for Variant Business
- MB-021: Multi-Attribute Variant Support
- MB-022: Variant Attribute Value Resolution
- MB-023: Variant Selection Dialog (Frontend)
- MB-024: Quantity Input for Weight/Unit Products
- MB-025: Invoice & Receipt Customization (backend)
- MB-026: Invoice & Receipt Customization (frontend)
- MB-027: Multi-Attribute Variants (full pipeline)
- MB-028: Payment Type Configuration (backend)
- MB-029: Payment Type Configuration (frontend config)
- MB-030: Catalog Grid Configurable
- MB-031: Quick Access Products
- MB-032: Cash/QR Toggle
- MB-033: Invoice Layout Customization
- MB-034: Supermarket Template Validation
- MB-035: Chicken Store Template Validation
- MB-036: Butcher Template Validation
- MB-037: Clothing Template Validation
- MB-038: Migrate TSLint to ESLint (flat config, 0 errors, 29 warnings)
- MB-039: Add Prettier (eslint-config-prettier integration)
- MB-040: Remove rxjs-compat
- MB-041: Lazy-load feature modules (vendei/reg/rep — 3 lazy chunks)
- MB-042: Add route guards (StoreProfileGuard)
- MB-043: Add HTTP interceptors (apiInterceptor — global error handling)
- MB-044: Fix production API configuration (window.__env runtime config)
- MB-045: Containerize deployment (Dockerfile, docker-compose, nginx.conf)
- MB-046: Remove Protractor

## In Progress

- None (All Phases Complete)

## Blocked

- None

## Next Task

All 46 tasks (MB-001 through MB-046) are complete across Phases 0-8.
Future work: Phase 9+ (new business templates, advanced analytics, mobile optimization)

## Tests

Unit (frontend):
- 599 tests
- ~12 pre-existing failures (AppComponent, Failure Scenarios x4, Reg*Components x4, PosCheckoutComponent x2, rep-product-sales-analytics)
- Zero new regressions from MB-004 through MB-046

Backend:
- Migration: PASS (25 migrations, db:migrate + db:seed:all)
- API smoke test: PASS (GET list, GET by id, POST create)
- Template validation: PASS (4 templates via phase7-template-validation.js)

Build (frontend):
- PASS (1.34 MB initial, 3 lazy chunks: vendei 123kB, reg 145kB, rep 252kB)

Lint:
- PASS (0 errors, 29 warnings)

## Important Decisions

1. **ADR-MB-001**: Extend StoreProfile in-place
2. **ADR-MB-002**: Product attributes via Definition/Value/Variant pattern
3. **ADR-MB-003**: Capabilities as string array on profile
4. **ADR-MB-004**: Add storeProfileId to Orders (optional with default)
5. **ADR-MB-005**: Configuration over business-specific code
6. **ADR-MB-006**: Three-layer migration strategy (SQL DEFAULT + backfill + frontend fallback)
7. **ADR-MB-007**: ESLint flat config format (future-proof for Angular 21+)
8. **ADR-MB-008**: Functional interceptors (Angular 21 pattern, not class-based)
9. **ADR-MB-009**: Feature modules with loadChildren for vendei/reg/rep
10. **ADR-MB-010**: CustomerListComponent standalone for cross-module reuse

## Commits

- `62e3706`: Phase 6 — MB-029 through MB-033 (Configurable POS)
- `28482e8`: Phase 7 frontend — MB-034 through MB-037 (Template validation)
- `efaf7e5`: Phase 7 backend — Template seeder updates + validation script
- `6ecec6b`: Phase 8 partial — MB-038/039/040/044/046 (ESLint, Prettier, cleanup)
- `a7b8225`: Phase 8 complete — MB-041/042/043/045 (Lazy-load, guards, interceptors, Docker)
  - RegAttributeListComponent: table with name, code, type, options, required, active columns
  - RegAttributeComponent: form with mat-select for type, conditional options textarea
  - Proxy entries for /productAttributeDefinitions, /productAttributeValues, /productVariants
  - Routes: /reg/attributes, /reg/attributes/new, /reg/attributes/:id
  - 20 new tests (10 list + 10 form), all passing
- MB-020: POS Integration for Variant Selection
  - Frontend: POS catalog opens VariantSelectDialog when product has active variants
  - Frontend: Cart line items record variantId, variantName, variantSku
  - Frontend: Variant price used when set, base price as fallback
  - Frontend: Composite line ID `${productId}-v${variantId}` for variant dedup
  - Frontend: Ticket lines display variant name, print receipt shows variant
  - Backend: Migration adds productVariantId to OrderDetails (nullable FK)
  - Backend: OrderDetail model + ProductVariant association
  - Backend: orderDetails controller saves/returns productVariantId with eager-loaded variant
  - 28 variant-related tests passing (8 dialog + 20 catalog), no regressions
- MB-021: Define Capability Enum/Constants (already existed)
- MB-022: Backend Capability Management (already existed)
- MB-023: Frontend Capability-Aware UI (already existed)
- MB-024: POS Capability Gating
  - PosCatalogComponent: canScanBarcode / hasVariantsEnabled getters
  - PosPaymentPanelComponent: hasDiscounts / hasCustomers getters
  - Quick code section gated by BARCODE capability
  - Variant dialog gated by PRODUCT_VARIANTS capability
  - Discount input gated by DISCOUNTS capability
  - Customer card gated by CUSTOMERS capability
  - 9 new capability gating tests (5 catalog + 4 payment panel), all passing
- MB-025: Define Selling Mode Types
  - SELLING_MODES constants (UNIT, WEIGHT, VARIABLE_QTY, VARIANT, COMBO)
  - SellingMode type, isDecimalSellingMode(), sellingModeUnitLabel()
  - resolveSellingMode() on VStoreProfileService (product override → profile default → UNIT)
  - 12 new unit tests for selling mode helpers
- MB-026: Backend Selling Mode Support
  - Migration adds sellingMode to Products (default: 'UNIT')
  - Migration adds unitLabel to OrderDetails
  - Product and OrderDetail models updated
  - orderDetails controller saves unitLabel on create
- MB-027: POS Selling Mode UI
  - QtyInputDialogComponent for decimal quantity entry (WEIGHT/VARIABLE_QTY)
  - Ticket lines show unit label (kg, m) next to quantity
  - Edit dialog supports decimal quantities with unit label
  - sellingMode and unitLabel stored on cart lines
- MB-028: Price Calculation Per Mode
  - Price = unitPrice × quantity (works for all modes)
  - Invoice/receipt shows quantity with unit label
  - Checkout passes unitLabel to backend on save
- MB-029: POS Configuration Model
  - Extended PosConfig with enabledPaymentTypes (default [1, 4] = Cash + QR)
  - Added getEnabledPaymentTypes() helper on VStoreProfileService
- MB-030: Configurable Catalog Layout
  - catalogColumns from PosConfig drives grid-template-columns
  - showProductImages from PosConfig conditionally shows/hides product images
  - Inline ngStyle binding replaces hardcoded CSS grid
- MB-031: Quick Products Configuration
  - quickProducts IDs from PosConfig resolved to product objects
  - Quick-access button bar in POS catalog
- MB-032: Payment Method Configuration
  - Cash/QR toggle buttons conditionally shown based on enabledPaymentTypes
  - Single method auto-selected when only one is enabled
- MB-033: Receipt Template Configuration
  - paperWidth from ReceiptConfig drives CSS width and @page size
  - headerLines from ReceiptConfig rendered as extra header paragraphs
  - footerLines from ReceiptConfig replace hardcoded footer
- MB-034: Supermarket Template Validation
  - 6 capabilities, 5 categories, 15 products, UNIT selling mode
  - posConfig: 4 columns, images on, Cash+QR payments
  - Backend validation script confirms all fields correct
- MB-035: Chicken Store Template Validation
  - 5 capabilities, 5 categories, 15 products, UNIT selling mode
  - posConfig: 3 columns, images on, Cash+QR payments
- MB-036: Butcher Template Validation
  - 6 capabilities, 5 categories, 15 products, WEIGHT selling mode
  - posConfig: 3 columns, images on, Cash+QR payments
  - Capabilities include LOT_TRACKING, EXPIRATION, WEIGHT_PRODUCTS
- MB-037: Clothing Template Validation
  - 6 capabilities, 5 categories, 15 products, VARIANT selling mode
  - posConfig: 4 columns, images on, Cash+QR payments
  - Capabilities include PRODUCT_VARIANTS, LOYALTY
- 30 SVG images created for missing butcher-shop and clothing-store templates
- All template seeders updated with enabledPaymentTypes

## In Progress

- None (Phase 6 complete)

## Blocked

- None

## Next Task

MB-029 (Phase 6 — Configurable POS): see ROADMAP.md

## Tests

Unit (frontend):
- 599 tests
- 12 pre-existing failures (AppComponent, Failure Scenarios x4, Reg*Components x4, PosCheckoutComponent x2, rep-product-sales-analytics)
- No regressions from MB-004 through MB-028

Backend:
- Migration: PASS (25 migrations, db:migrate + db:seed:all)
- API smoke test: PASS (GET list, GET by id, POST create)

Build (frontend):
- PASS

## Important Decisions

1. **ADR-MB-001**: Extend StoreProfile in-place
2. **ADR-MB-002**: Product attributes via Definition/Value/Variant pattern
3. **ADR-MB-003**: Capabilities as string array on profile
4. **ADR-MB-004**: Add storeProfileId to Orders (optional with default)
5. **ADR-MB-005**: Configuration over business-specific code
6. **ADR-MB-006**: Three-layer migration strategy (SQL DEFAULT + backfill + frontend fallback)

## Notes for Next Session

1. MB-034 through MB-037 complete — Phase 7 done
2. Phase 8 (Architecture Hardening) can begin (lazy-load, ESLint, Prettier, route guards)
3. Read ROADMAP.md for remaining tasks
