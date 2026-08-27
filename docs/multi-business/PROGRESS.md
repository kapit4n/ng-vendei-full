# Multi-Business Progress

Last Updated: 2026-08-26

Current Phase: Phase 6 (Complete)
In Progress: None (Phase 6 Complete)

Current Task: MB-033 COMPLETED — Phase 6 done

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
  - 4 new tables: ProductAttributeDefinitions, ProductAttributeValues, ProductVariants, ProductVariantAttributeValues
  - JSON-as-TEXT for options array (SQLite compatibility)
  - Full index coverage for all FK and lookup columns
- MB-016: Design ProductAttributeValue Model (completed as part of MB-015)
- MB-017: Design ProductVariant Model (completed as part of MB-015)
- MB-018: Backend API for Attributes
  - 3 controllers with full CRUD: attribute definitions, values, variants
  - Transactional create/update for variants with attribute value links
  - Filtering by storeProfileId, productId, active status
  - Nested eager loading for variant -> attributeValue -> definition
- MB-019: Frontend Attribute Management UI
  - RAttributeDefinitionService: CRUD calling /productAttributeDefinitions API
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

1. MB-029 through MB-033 complete — Phase 6 done
2. Phase 7 (Business Template Validation) can begin
3. Read ROADMAP.md for remaining tasks
