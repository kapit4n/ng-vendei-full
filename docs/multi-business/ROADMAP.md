# Multi-Business Roadmap

## Phase 0 — Baseline and Architecture Discovery

**Status:** COMPLETED

Analyze the current domain models, identify supermarket-specific assumptions, and document the baseline architecture.

### Tasks

- MB-001: Baseline Architecture Analysis
- MB-002: Run test suite and record baseline results
- MB-003: Document hardcoded business assumptions

### Deliverables

- [x] docs/multi-business/ structure created
- [ ] ARCHITECTURE.md with current state analysis
- [ ] DECISIONS.md with initial architecture decisions
- [ ] Baseline test results recorded
- [ ] Hardcoded assumptions catalog

---

## Phase 1 — Multi-Business Domain Foundation

**Status:** COMPLETED

Introduce the conceptual model for BusinessProfile, BusinessType, BusinessCapability, and BusinessSettings.

### Tasks

- MB-004: Extend StoreProfile interface with business configuration
- MB-005: Add storeProfileId to Order model
- MB-006: Make hardcoded values configurable through profile
- MB-007: Add backend API endpoints for extended profile fields
- MB-008: Frontend service updates for BusinessProfile
- MB-009: Migration strategy for existing data

### Acceptance Criteria

- Existing stores continue working
- Existing POS continues working
- Existing catalog remains available
- Existing sales remain available
- Orders are tagged with business profile

---

## Phase 2 — Catalog Templates

**Status:** COMPLETED

Introduce CatalogTemplate, CatalogTemplateCategory, CatalogTemplateProduct.

### Tasks

- MB-010: Design catalog template data model
- MB-011: Create template seed data for 6 business types
- MB-012: Implement template application API
- MB-013: Frontend template selection UI
- MB-014: Template-based product seeding

### Initial Templates

- Supermarket
- Chicken Store
- Butcher Shop
- Clothing Store
- Bakery
- Hardware Store

### Acceptance Criteria

- New business can be created from a template
- Templates define categories, products, units, presentations
- Templates include product images from existing SVG catalog
- Adding a new template does not require POS engine changes

---

## Phase 3 — Generic Product Attributes

**Status:** IN_PROGRESS

Design a flexible product-attribute system for cross-industry product variation.

### Tasks

- MB-015: Design ProductAttributeDefinition model
- MB-016: Design ProductAttributeValue model
- MB-017: Design ProductVariant model
- MB-018: Backend API for attributes
- MB-019: Frontend attribute management UI
- MB-020: POS integration for variant selection

### Attribute Examples

| Business | Attributes |
|----------|-----------|
| Clothing | Size, Color, Brand |
| Chicken | Portion, Preparation |
| Hardware | Brand, Voltage, Model |
| Supermarket | Weight, Package Size |
| Butcher | Cut, Weight Range |

### Acceptance Criteria

- Products can have arbitrary key-value attributes
- Variants are combinations of attribute values
- POS can filter/select by attribute
- No separate product tables per business type

### Completion

- [x] MB-015, MB-016, MB-017: Data model (4 tables + migration)
- [x] MB-018: Backend CRUD API (3 controllers + routes)
- [x] MB-019: Frontend attribute management UI (list + form + 20 tests)
- [x] MB-020: POS variant selection integration

---

## Phase 4 — Business Capabilities

**Status:** NOT_STARTED

Create a capability system that controls which features are enabled per business.

### Tasks

- MB-021: Define capability enum/constants
- MB-022: Backend capability management
- MB-023: Frontend capability-aware UI
- MB-024: POS capability gating

### Initial Capabilities

```text
BARCODE              — barcode scanning support
WEIGHT_PRODUCTS      — sell by weight
VARIABLE_QUANTITY    — variable quantity pricing
LOT_TRACKING         — lot-level inventory
EXPIRATION           — expiry date tracking
PRODUCT_VARIANTS     — size/color/variant support
COMBOS               — product bundles/combos
DISCOUNTS            — discount line items
CUSTOMERS            — customer management
SERIAL_NUMBERS       — serial number tracking
TAX_CALCULATION      — tax computation
LOYALTY              — loyalty program
```

### Acceptance Criteria

- Capabilities are configurable per business profile
- POS UI adapts based on enabled capabilities
- Disabling a capability hides relevant UI elements
- Capabilities are stored in business profile

---

## Phase 5 — Advanced Selling Modes

**Status:** NOT_STARTED

Support generic selling modes beyond simple unit sales.

### Tasks

- MB-025: Define selling mode types
- MB-026: Backend selling mode support
- MB-027: POS selling mode UI
- MB-028: Price calculation per mode

### Selling Modes

| Mode | Example | Use Case |
|------|---------|----------|
| UNIT | 1 Coca-Cola | Standard retail |
| WEIGHT | 1.25 kg × Bs 30/kg | Butcher, produce |
| VARIABLE_QTY | 2.5 meters × Bs 20/m | Fabric, wire |
| VARIANT | T-Shirt / XL / Black | Clothing |
| COMBO | Family Chicken Combo | Bundled products |

### Acceptance Criteria

- Each product/presentation can specify its selling mode
- POS calculates price correctly per mode
- Receipt shows correct quantity/unit/price format
- Existing unit-sales mode continues working

---

## Phase 6 — Configurable POS

**Status:** NOT_STARTED

Allow Business Profile configuration to control POS behavior.

### Tasks

- MB-029: POS configuration model
- MB-030: Configurable catalog layout
- MB-031: Quick products configuration
- MB-032: Payment method configuration
- MB-033: Receipt template configuration

### Configurable Elements

- Catalog grid layout (columns, card size)
- Visible categories and ordering
- Quick-access products
- Payment methods enabled
- Receipt header/footer content
- Printer paper width
- Currency display format

### Acceptance Criteria

- POS appearance adapts to business profile
- No POS component duplication per business type
- Configuration is stored in business profile
- Default configuration works for new businesses

---

## Phase 7 — Business Template Validation

**Status:** NOT_STARTED

Create complete working templates for 4 business types.

### Tasks

- MB-034: Supermarket template (barcode, units, inventory, expiration)
- MB-035: Chicken Store template (portions, combos, fast checkout)
- MB-036: Butcher template (weight, price/kg, lots, expiration)
- MB-037: Clothing template (variants, sizes, colors, SKU)

### Acceptance Criteria

- All 4 templates create working businesses
- Each uses the same core POS engine
- Business-specific features work through configuration
- POS regression tests pass for all templates

---

## Phase 8 — Architecture Hardening

**Status:** NOT_STARTED

Only after multi-business functionality is stable.

### Tasks

- MB-038: Migrate TSLint to ESLint
- MB-039: Add Prettier
- MB-040: Remove rxjs-compat
- MB-041: Lazy-load feature modules
- MB-042: Add route guards
- MB-043: Add HTTP interceptors
- MB-044: Fix production API configuration
- MB-045: Containerize deployment
- MB-046: Remove Protractor

### Acceptance Criteria

- All existing tests pass
- Build produces smaller bundle via lazy loading
- Code formatting is enforced
- CI pipeline runs lint + test + build
